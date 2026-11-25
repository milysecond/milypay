// Payer side of the Milypay Helius Rings rail: a private wallet that can shield
// (deposit), pay Milypay privately, and unshield (withdraw).
//
// Proofs run in Helius's attested TEE prover through Milypay's sponsored,
// rate-limited proxy (or any endpoints you pass). Requests to the prover are
// HPKE-encrypted to the enclave, so the proxy never sees the witness.

import {
  createSolanaRpc,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  signTransactionWithSigners,
  type Address,
  type Transaction,
} from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import {
  SOL_MINT,
  ShieldedAddress,
  ShieldedKeypair,
  SigningKey,
  Wallet,
  buildDepositTransaction,
  buildTransferTransaction,
  buildWithdrawalTransaction,
  initializePoseidon,
  syncWallet,
} from "@heliuslabs/spr";
import { LocalKeys, SignedTeePolicy, SprClient } from "@heliuslabs/spr/client";
import { ed25519 } from "@noble/curves/ed25519.js";
import {
  MILYPAY_RING_ENDPOINTS,
  RING_MINTS,
  base58Encode,
  ringBindingMessage,
  type RingProof,
  type RingRequirement,
  type RingSymbol,
} from "./protocol.js";

export interface RingEndpoints {
  rpcUrl: string;
  indexerUrl: string;
  proverUrl: string;
  /** "mainnet" pins Helius's signed TEE prover policy; "localnet" uses a plaintext loopback prover. */
  network?: "mainnet" | "devnet" | "localnet";
}

export function resolveMint(asset: string): { mint: string; decimals: number; symbol: string } {
  const up = asset.toUpperCase();
  if (up === "SOL") return { mint: SOL_MINT, decimals: 9, symbol: "SOL" };
  if (up in RING_MINTS) {
    const m = RING_MINTS[up as RingSymbol];
    return { mint: m.mint, decimals: m.decimals, symbol: up };
  }
  for (const [sym, m] of Object.entries(RING_MINTS)) if (m.mint === asset) return { mint: m.mint, decimals: m.decimals, symbol: sym };
  return { mint: asset, decimals: 6, symbol: asset.slice(0, 4) + "…" };
}

export function toAtomic(human: string, decimals: number): bigint {
  const [whole, frac = ""] = human.trim().split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

export function fromAtomic(amount: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = (amount % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export class RingWallet {
  readonly client: SprClient;
  readonly keypair: ShieldedKeypair;
  readonly wallet: Wallet;
  readonly endpoints: Required<RingEndpoints>;
  #seed: Uint8Array;
  #keys: ReturnType<typeof LocalKeys.fromKeypair>;
  #synced = false;

  private constructor(seed: Uint8Array, endpoints: Required<RingEndpoints>) {
    this.#seed = seed;
    this.endpoints = endpoints;
    const local = endpoints.network === "localnet";
    this.client = new SprClient({
      solanaRpcUrl: endpoints.rpcUrl,
      indexerUrl: endpoints.indexerUrl,
      proverUrl: endpoints.proverUrl,
      commitment: "confirmed",
      ...(local ? {} : { proverTee: SignedTeePolicy.forNetwork(endpoints.network as "mainnet" | "devnet") }),
    });
    this.keypair = ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(seed as never));
    this.wallet = new Wallet({ identity: this.keypair.shieldedAddress() });
    this.#keys = LocalKeys.fromKeypair(this.keypair, this.client.proofService);
  }

  /**
   * `secret` is a Solana secret key: 64 bytes (seed||pubkey) or a 32-byte seed.
   * The shielded keypair is derived from the same seed, so the private balance
   * belongs to the same Solana address.
   */
  static async create(secret: Uint8Array, endpoints: Partial<RingEndpoints> = {}): Promise<RingWallet> {
    await initializePoseidon();
    if (secret.length !== 64 && secret.length !== 32) throw new Error("Solana secret must be 64 or 32 bytes");
    const seed = Uint8Array.from(secret.subarray(0, 32));
    return new RingWallet(seed, {
      rpcUrl: endpoints.rpcUrl ?? MILYPAY_RING_ENDPOINTS.rpcUrl,
      indexerUrl: endpoints.indexerUrl ?? MILYPAY_RING_ENDPOINTS.indexerUrl,
      proverUrl: endpoints.proverUrl ?? MILYPAY_RING_ENDPOINTS.proverUrl,
      network: endpoints.network ?? "mainnet",
    });
  }

  get address(): string {
    return this.keypair.shieldedAddress().solanaAddress();
  }

  get shieldedAddressHex(): string {
    return Buffer.from(this.keypair.shieldedAddress().toBytes()).toString("hex");
  }

  async sync(requireSlot?: bigint): Promise<void> {
    await syncWallet({
      client: this.client,
      wallet: this.wallet,
      keys: this.#keys,
      ...(requireSlot !== undefined ? { config: { requireSlot } } : {}),
    });
    this.#synced = true;
  }

  async balance(asset: string): Promise<{ symbol: string; mint: string; atomic: bigint; amount: string }> {
    if (!this.#synced) await this.sync();
    const m = resolveMint(asset);
    let atomic = 0n;
    try {
      atomic = this.wallet.balance(m.mint as Address).amount;
    } catch {
      atomic = 0n;
    }
    return { symbol: m.symbol, mint: m.mint, atomic, amount: fromAtomic(atomic, m.decimals) };
  }

  async balances(): Promise<Array<{ symbol: string; mint: string; atomic: bigint; amount: string }>> {
    if (!this.#synced) await this.sync();
    return this.wallet.balances(true).map((b) => {
      const m = resolveMint(b.mint);
      return { symbol: m.symbol, mint: b.mint, atomic: b.amount, amount: fromAtomic(b.amount, m.decimals) };
    });
  }

  /** Public SOL balance of the fee-paying address (lamports). */
  async publicSol(): Promise<bigint> {
    const rpc = createSolanaRpc(this.endpoints.rpcUrl);
    const r = await rpc.getBalance(this.address as Address, { commitment: "confirmed" }).send();
    return r.value;
  }

  async #submit(tx: Transaction, opts: { simulateOnly?: boolean } = {}): Promise<{ signature: string; slot?: bigint; simulation?: unknown }> {
    const signer = this.keypair.toSolanaSigner();
    const signed = await signTransactionWithSigners([signer], tx);
    const wire = getBase64EncodedWireTransaction(signed);
    const signature = getSignatureFromTransaction(signed);
    const rpc = createSolanaRpc(this.endpoints.rpcUrl);
    if (opts.simulateOnly) {
      const sim = await rpc
        .simulateTransaction(wire, { encoding: "base64", sigVerify: false, commitment: "confirmed", replaceRecentBlockhash: true } as never)
        .send();
      return { signature, simulation: sim.value };
    }
    await rpc.sendTransaction(wire, { encoding: "base64", preflightCommitment: "confirmed", skipPreflight: false } as never).send();
    const slot = await this.client.confirmTransaction(signature);
    return { signature, slot };
  }

  /** Public -> private. SPL deposits create the mint's interface vault on first use (createSplInterface). */
  async shield(asset: string, human: string, opts: { simulateOnly?: boolean } = {}) {
    const m = resolveMint(asset);
    const amount = toAtomic(human, m.decimals);
    const params: Parameters<typeof buildDepositTransaction>[0] = {
      client: this.client,
      feePayer: this.address as Address,
      recipient: this.keypair.shieldedAddress(),
      amount,
      ...(m.mint === SOL_MINT
        ? {}
        : {
            asset: m.mint as Address,
            splTokenAccount: (
              await findAssociatedTokenPda({
                owner: this.address as Address,
                mint: m.mint as Address,
                tokenProgram: TOKEN_PROGRAM_ADDRESS,
              })
            )[0],
          }),
    };
    const tx = await buildDepositTransaction(params);
    const out = await this.#submit(tx, opts);
    if (out.slot !== undefined) await this.sync(out.slot);
    return { ...out, amount, mint: m.mint, symbol: m.symbol };
  }

  /** Private -> public withdrawal (reveals destination, asset and amount). */
  async unshield(asset: string, human: string, to?: string) {
    if (!this.#synced) await this.sync();
    const m = resolveMint(asset);
    const amount = toAtomic(human, m.decimals);
    const tx = await buildWithdrawalTransaction({
      client: this.client,
      wallet: this.wallet,
      keys: this.#keys,
      feePayer: this.address as Address,
      recipient: (to ?? this.address) as Address,
      amount,
      ...(m.mint === SOL_MINT ? {} : { asset: m.mint as Address }),
    });
    const out = await this.#submit(tx);
    if (out.slot !== undefined) await this.sync(out.slot);
    return { ...out, amount, mint: m.mint, symbol: m.symbol };
  }

  /** Private transfer of `amount` atomic units of `mint` to a shielded address (hex). */
  async transfer(shieldedAddressHex: string, mint: string, amount: bigint) {
    if (!this.#synced) await this.sync();
    const recipient = ShieldedAddress.fromBytes(hexToBytes(shieldedAddressHex));
    const tx = await buildTransferTransaction({
      client: this.client,
      wallet: this.wallet,
      keys: this.#keys,
      feePayer: this.address as Address,
      recipient,
      amount,
      ...(mint === SOL_MINT ? {} : { asset: mint as Address }),
    });
    const out = await this.#submit(tx);
    if (out.slot !== undefined) await this.sync(out.slot);
    return out as { signature: string; slot: bigint };
  }

  /** Signs the Milypay binding message so the server knows this tx is yours. */
  bind(txSignature: string): RingProof {
    const sig = ed25519.sign(new TextEncoder().encode(ringBindingMessage(txSignature)), this.#seed);
    return { txSignature, payer: this.address, signature: base58Encode(sig) };
  }

  /** Pay one `private-exact` requirement; returns the proof for PAYMENT-SIGNATURE. */
  async payRequirement(req: RingRequirement): Promise<RingProof & { slot: string }> {
    const amount = BigInt(req.amount);
    const out = await this.transfer(req.extra.shieldedAddress, req.asset, amount);
    return { ...this.bind(out.signature), slot: out.slot.toString() };
  }

  destroy(): void {
    this.#seed.fill(0);
    this.keypair.destroy();
  }
}
