import { Keypair, type VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";

const ENV_KEYS = [
  "MILYPAY_PRIVATE_KEY",
  "MILYPAY_SECRET",
  "SOLANA_PAYER_SECRET",
  "SOLANA_PRIVATE_KEY",
] as const;

export type Wallet = {
  address: string;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  source: string;
};

function decodeSecret(raw: string): Uint8Array {
  const s = raw.trim();
  // JSON byte array
  if (s.startsWith("[")) {
    const arr = JSON.parse(s) as number[];
    return Uint8Array.from(arr);
  }
  // base58 secret key
  return bs58.decode(s);
}

/** Load wallet from env. Returns null if none configured. */
export function loadWallet(): Wallet | null {
  for (const name of ENV_KEYS) {
    const raw = process.env[name];
    if (!raw?.trim()) continue;
    try {
      const kp = Keypair.fromSecretKey(decodeSecret(raw));
      return {
        address: kp.publicKey.toBase58(),
        source: name,
        signTransaction: async (tx: VersionedTransaction) => {
          tx.sign([kp]);
          return tx;
        },
      };
    } catch (e) {
      throw new Error(`Invalid secret in ${name}: ${(e as Error).message}`);
    }
  }
  return null;
}

export function walletHelp(): string {
  return [
    "No Solana wallet configured. Paid API host (api.milypay.xyz) needs one of:",
    "  MILYPAY_PRIVATE_KEY   base58 or JSON secret key",
    "  SOLANA_PAYER_SECRET   same",
    "  SOLANA_PRIVATE_KEY    same",
    "",
    "Without a wallet the CLI uses the free demo host (milypay.xyz, rate-limited).",
  ].join("\n");
}
