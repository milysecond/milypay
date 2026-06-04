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
  });
  return client.fetch(url, init);
}

export function payerAddress(): string {
  return getPayer().publicKey.toString();
}
