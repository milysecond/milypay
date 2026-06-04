// Server-side x402 payer: lets the Worker pay an upstream x402 service (e.g. Birdeye)
// in USDC on Solana, using a funded server keypair. Used to resell third-party pay.sh
// services, settled to MilyPay customers in AUDD.
//
// Config (Worker secret): SOLANA_PAYER_SECRET (base58 secret key of the funded payer).

import { Keypair, type VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { createX402Client } from "x402-solana/client";

let payer: Keypair | null = null;

function getPayer(): Keypair {
  if (!payer) {
    const sk = process.env.SOLANA_PAYER_SECRET;
    if (!sk) throw new Error("SOLANA_PAYER_SECRET not configured");
    payer = Keypair.fromSecretKey(bs58.decode(sk.trim()));
  }
  return payer;
}

function paymentId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return "pay_" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

// Some x402 providers (e.g. Birdeye) require a payment-identifier extension that
// x402-solana does not yet set. Inject it into the PAYMENT-SIGNATURE before sending.
const customFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  const sig = headers.get("PAYMENT-SIGNATURE");
  if (sig) {
    try {
      const payload = JSON.parse(atob(sig)) as Record<string, unknown>;
      const ext = (payload.extensions as Record<string, unknown>) || {};
      ext["payment-identifier"] = { info: { id: paymentId() } };
      payload.extensions = ext;
      headers.set("PAYMENT-SIGNATURE", btoa(JSON.stringify(payload)));
    } catch {
      /* leave header as-is */
    }
  }
  return fetch(input, { ...init, headers });
};

// Pay an upstream x402 resource and return its Response. maxAtomicUsdc caps spend per call.
export async function payAndFetch(
  url: string,
  init?: RequestInit,
  maxAtomicUsdc = 100_000, // 0.10 USDC ceiling
): Promise<Response> {
  const kp = getPayer();
  const client = createX402Client({
    wallet: {
      address: kp.publicKey.toString(),
      signTransaction: async (tx: VersionedTransaction) => {
        tx.sign([kp]);
        return tx;
      },
    },
    network: "solana",
    rpcUrl: process.env.SOLANA_RPC_URL || "https://solana-rpc.publicnode.com",
    amount: BigInt(maxAtomicUsdc),
    customFetch,
  });
  return client.fetch(url, init);
}

export function payerAddress(): string {
  return getPayer().publicKey.toString();
}
