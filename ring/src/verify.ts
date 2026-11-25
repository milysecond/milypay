// Server-side verification of a Helius Rings private payment, watch-only.
//
// Needs only the recipient's VIEWING key (decrypts incoming outputs) and its
// public shielded address. It cannot spend: the signing and nullifier keys stay
// offline. The caller must have initialised the Poseidon hasher first
// (`initializePoseidon()` in Node; the ring Worker loads the WASM module).

import { ed25519 } from "@noble/curves/ed25519.js";
import { createSolanaRpc } from "@solana/kit";
import { ShieldedAddress, ViewingKey } from "@heliuslabs/spr";
import { Wallet, decryptTransactions } from "@heliuslabs/spr/transaction";
import { backfillAssetRegistry } from "@heliuslabs/spr/wallet";
import { SprClient } from "@heliuslabs/spr/client";
import {
  RING_MAX_PAYMENT_AGE_SECONDS,
  RING_PROGRAM_ID,
  base58Decode,
  ringBindingMessage,
} from "./protocol.js";

export type RingVerifyCode =
  | "invalid_proof"
  | "bad_binding_signature"
  | "tx_not_found"
  | "tx_failed"
  | "not_a_ring_tx"
  | "payer_not_signer"
  | "payment_too_old"
  | "indexer_pending"
  | "no_payment_to_merchant"
  | "underpaid"
  | "upstream_error";

export type RingVerifyFailure = { ok: false; code: RingVerifyCode; message: string; retryable: boolean };
export type RingVerifyResult = { ok: true; amount: bigint; slot: number; blockTime: number | null } | RingVerifyFailure;

export interface RingVerifyInput {
  /** Solana JSON-RPC URL (mainnet). */
  rpcUrl: string;
  /** Privacy indexer base, e.g. https://<helius host>/v1/spr */
  indexerUrl: string;
  /** Hex of ViewingKey.secretBytes() (32 bytes). */
  viewingKeyHex: string;
  /** Hex of ShieldedAddress.toBytes() (99 bytes). */
  shieldedAddressHex: string;
  txSignature: string;
  payer: string;
  /** Base58 ed25519 signature over ringBindingMessage(txSignature). */
  signature: string;
  mint: string;
  minAmount: bigint;
  nowSeconds?: number;
  fetchImpl?: typeof fetch;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/, "");
  if (clean.length % 2 !== 0 || /[^0-9a-f]/i.test(clean)) throw new Error("invalid hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/**
 * Cloudflare Workers reject `redirect: "error"` (which the SDK uses). Map it to
 * "manual" and treat any 3xx as a request failure — same semantics, Worker-safe.
 */
export const workerSafeFetch: typeof globalThis.fetch = async (input, init) => {
  if (init?.redirect === "error") {
    const res = await globalThis.fetch(input, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) throw new TypeError("unexpected redirect");
    return res;
  }
  return globalThis.fetch(input, init);
};

function errorChain(e: unknown): string {
  const parts: string[] = [];
  let cur: unknown = e;
  for (let i = 0; i < 4 && cur; i++) {
    const err = cur as { message?: string; code?: string; cause?: unknown };
    parts.push(String(err.code ?? err.message ?? cur).slice(0, 160));
    cur = err.cause;
  }
  return parts.join(" <- ");
}

const fail = (code: RingVerifyCode, message: string, retryable = false): RingVerifyFailure => ({
  ok: false,
  code,
  message,
  retryable,
});

async function jsonRpc(
  fetchImpl: typeof fetch,
  url: string,
  method: string,
  params: unknown,
): Promise<{ result?: unknown; error?: { code?: number; message?: string } }> {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "milypay-ring", method, params }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${method} http ${res.status}`);
  return (await res.json()) as { result?: unknown; error?: { code?: number; message?: string } };
}

/** Watch-only ShieldedKeys: decrypt with the viewing key; no nullifier secret. */
function watchOnlyKeys(address: ShieldedAddress, vk: ViewingKey) {
  return {
    address: () => address,
    viewingPublicKeys: () => [vk.publicKey()],
    decrypt: async (
      reqs: readonly {
        ciphertext: Uint8Array;
        txViewingPublicKey: Parameters<ViewingKey["decryptUtxo"]>[1];
        salt: Parameters<ViewingKey["decryptUtxo"]>[2];
        slotIndex: number;
        label: "transfer" | "ringDeposit";
      }[],
    ) =>
      reqs.map((r) =>
        r.label === "ringDeposit"
          ? vk.decryptRingDeposit(r.ciphertext, r.txViewingPublicKey, r.salt)
          : vk.decryptUtxo(r.ciphertext, r.txViewingPublicKey, r.salt, r.slotIndex),
      ),
    // Nullifiers only matter for spend tracking, never for reading an incoming
    // payment. The verifier deliberately has no nullifier secret.
    derive: async (reqs: readonly unknown[]) => reqs.map(() => new Uint8Array(32)),
    transactionKeys: async (reqs: readonly { firstNullifier: Uint8Array }[]) =>
      reqs.map((r) => vk.transactionViewingKey(r.firstNullifier as never)),
  };
}

/** Amount of `mint` that `txSignature` paid to the shielded address (decrypted, commitment-checked). */
export async function decryptPaymentAmount(args: {
  indexerUrl: string;
  rpcUrl: string;
  viewingKeyHex: string;
  shieldedAddressHex: string;
  txSignature: string;
  mint: string;
  minContextSlot?: number;
  fetchImpl?: typeof fetch;
}): Promise<{ amount: bigint; events: number; contextSlot: number }> {
  // SprClient here is read-only: Solana RPC + privacy indexer, no prover.
  const client = new SprClient({
    solanaRpcUrl: args.rpcUrl,
    indexerUrl: args.indexerUrl.replace(/\/+$/, ""),
    fetch: workerSafeFetch,
  });
  const decoded = await client.getShieldedTransactionsBySignature(args.txSignature as never);
  const contextSlot = Number(decoded.context.slot);
  const txs = decoded.transactions.map((t) => t.transaction);
  if (txs.length === 0) return { amount: 0n, events: 0, contextSlot };

  const vk = ViewingKey.fromBytes(hexToBytes(args.viewingKeyHex) as never);
  const address = ShieldedAddress.fromBytes(hexToBytes(args.shieldedAddressHex));
  const keys = watchOnlyKeys(address, vk);
  try {
    let wallet = new Wallet({ identity: address });
    const report = await decryptTransactions({ wallet, keys: keys as never, transactions: txs });
    if (report.unknownAssetIds.length > 0 || report.unknownAssetFields.length > 0) {
      const registryRpc = { solanaRpc: createSolanaRpc(args.rpcUrl), commitment: "confirmed" as const };
      void args.fetchImpl;
      const scratch = new Wallet({ identity: address });
      await backfillAssetRegistry(scratch, registryRpc as never);
      wallet = new Wallet({ identity: address, registry: scratch.registry });
      await decryptTransactions({ wallet, keys: keys as never, transactions: txs });
    }
    let amount = 0n;
    try {
      amount = wallet.balance(args.mint as never).amount;
    } catch {
      amount = 0n;
    }
    return { amount, events: txs.length, contextSlot };
  } finally {
    vk.destroy();
  }
}

/** Checks proof shape + the payer's ed25519 binding. Returns a failure, or null when valid. */
export function verifyRingBinding(input: { txSignature: string; payer: string; signature: string }): RingVerifyFailure | null {
  let sigBytes: Uint8Array, payerBytes: Uint8Array, txSigBytes: Uint8Array;
  try {
    sigBytes = base58Decode(input.signature);
    payerBytes = base58Decode(input.payer);
    txSigBytes = base58Decode(input.txSignature);
  } catch {
    return fail("invalid_proof", "txSignature, payer and signature must be base58");
  }
  if (sigBytes.length !== 64 || payerBytes.length !== 32 || txSigBytes.length !== 64) {
    return fail("invalid_proof", "txSignature/signature must be 64 bytes and payer 32 bytes");
  }
  const msg = new TextEncoder().encode(ringBindingMessage(input.txSignature));
  let bindingOk = false;
  try {
    bindingOk = ed25519.verify(sigBytes, msg, payerBytes);
  } catch {
    bindingOk = false;
  }
  if (!bindingOk) {
    return fail("bad_binding_signature", "signature does not verify for payer over milypay-ring:v1:<txSignature>");
  }

  return null;
}

export async function verifyRingPayment(input: RingVerifyInput): Promise<RingVerifyResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);

  // 1. Proof shape + payer binding (stops anyone replaying someone else's public tx signature).
  const binding = verifyRingBinding(input);
  if (binding) return binding;

  // 2. The transaction landed, succeeded, ran the Rings program and was signed by the payer.
  let slot = 0;
  let blockTime: number | null = null;
  try {
    const r = await jsonRpc(fetchImpl, input.rpcUrl, "getTransaction", [
      input.txSignature,
      { encoding: "json", commitment: "confirmed", maxSupportedTransactionVersion: 1 },
    ]);
    if (r.error) return fail("upstream_error", `rpc: ${r.error.message ?? "error"}`, true);
    const tx = r.result as {
      slot: number;
      blockTime?: number | null;
      meta?: { err?: unknown; loadedAddresses?: { writable?: string[]; readonly?: string[] } } | null;
      transaction?: {
        message?: { accountKeys?: string[]; header?: { numRequiredSignatures?: number } };
      };
    } | null;
    if (!tx) return fail("tx_not_found", "transaction not found or not yet confirmed", true);
    if (tx.meta?.err) return fail("tx_failed", "transaction failed on-chain");
    const keys = tx.transaction?.message?.accountKeys ?? [];
    const allKeys = [
      ...keys,
      ...(tx.meta?.loadedAddresses?.writable ?? []),
      ...(tx.meta?.loadedAddresses?.readonly ?? []),
    ];
    if (!allKeys.includes(RING_PROGRAM_ID)) return fail("not_a_ring_tx", "transaction does not invoke the Rings program");
    const signers = keys.slice(0, tx.transaction?.message?.header?.numRequiredSignatures ?? 1);
    if (!signers.includes(input.payer)) return fail("payer_not_signer", "payer did not sign the payment transaction");
    slot = tx.slot;
    blockTime = tx.blockTime ?? null;
    if (blockTime !== null && now - blockTime > RING_MAX_PAYMENT_AGE_SECONDS) {
      return fail("payment_too_old", "payment transaction is older than 7 days");
    }
  } catch (e) {
    return fail("upstream_error", `rpc unavailable: ${e instanceof Error ? e.message : "error"}`, true);
  }

  // 3. Decrypt what the transaction paid to Milypay's shielded address.
  let amount = 0n;
  try {
    const out = await decryptPaymentAmount({
      indexerUrl: input.indexerUrl,
      rpcUrl: input.rpcUrl,
      viewingKeyHex: input.viewingKeyHex,
      shieldedAddressHex: input.shieldedAddressHex,
      txSignature: input.txSignature,
      mint: input.mint,
      fetchImpl,
    });
    if (out.events === 0) {
      return fail("indexer_pending", `indexer has not indexed this transaction yet (indexer slot ${out.contextSlot}, tx slot ${slot})`, true);
    }
    amount = out.amount;
  } catch (e) {
    return fail("upstream_error", `indexer unavailable: ${errorChain(e)}`, true);
  }
  if (amount === 0n) return fail("no_payment_to_merchant", "no private output of this asset to Milypay in that transaction");
  if (amount < input.minAmount) {
    return fail("underpaid", `paid ${amount} < required ${input.minAmount} (atomic units)`);
  }
  return { ok: true, amount, slot, blockTime };
}

export { initializePoseidon, ShieldedAddress } from "@heliuslabs/spr";
