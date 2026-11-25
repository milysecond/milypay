// Helius Privacy Rings payment rail for Milypay: shared wire protocol.
// Dependency-free so the main Next Worker, the ring verifier Worker and the
// client package can all import it.
//
// Privacy model (Default Ring): CONFIDENTIAL, NOT ANONYMOUS. The asset and the
// amount are encrypted on-chain; the payer and recipient wallet addresses stay
// public. Milypay itself still sees the request and the paying wallet.

export const RING_SCHEME = "private-exact" as const;
export const RING_RAIL = "helius-rings" as const;
export const RING_LABEL = "beta" as const;
export const RING_PRIVACY = "confidential, not anonymous" as const;
export const RING_PROTOCOL_VERSION = 1 as const;

/** Mainnet and devnet share these addresses (helius.dev/docs/privacy/addresses). */
export const RING_PROGRAM_ID = "ring1GaLCuJnkUMVkX2JeZLTTX17wKsV4fZmPVzXANW";
export const RING_REGISTRY_PROGRAM_ID = "regy3WAeRXMYuMYxr5iK3Bf9Arr3PcxGxyzAddbiqDQ";
export const RING_STATE_TREE = "777pvSGe5LaBd9nCczvE2FXEauiwtfGJ5XRpjKyniGor";

export const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

export const RING_MINTS = {
  USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  AUDD: { mint: "AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw", decimals: 6 },
} as const;
export type RingSymbol = keyof typeof RING_MINTS;

/** Public endpoints Milypay sponsors for payers (rate-limited, daily credit cap). */
export const MILYPAY_RING_ENDPOINTS = {
  rpcUrl: "https://api.milypay.xyz/ring/rpc",
  indexerUrl: "https://api.milypay.xyz/ring/indexer",
  proverUrl: "https://api.milypay.xyz/ring/prover",
} as const;

/** How long a verified-but-not-yet-served payment can be retried (seconds). */
export const RING_RETRY_WINDOW_SECONDS = 600;
/** Oldest payment transaction the server accepts (seconds). */
export const RING_MAX_PAYMENT_AGE_SECONDS = 7 * 24 * 3600;

/** `extra` of a `private-exact` accepts[] entry. */
export interface RingRequirementExtra {
  rail: typeof RING_RAIL;
  label: typeof RING_LABEL;
  privacy: typeof RING_PRIVACY;
  version: typeof RING_PROTOCOL_VERSION;
  ring: "default";
  programId: string;
  /** Recipient shielded address, hex of the SDK's 99-byte `ShieldedAddress.toBytes()`. */
  shieldedAddress: string;
  symbol: RingSymbol;
  decimals: number;
  /** Sponsored endpoints for building and proving the payment. */
  endpoints: { rpcUrl: string; indexerUrl: string; proverUrl: string };
  /** What the payer signs with the key that signed the payment transaction. */
  binding: string;
  retryWindowSeconds: number;
  docs: string;
}

export interface RingRequirement {
  scheme: typeof RING_SCHEME;
  network: string;
  amount: string;
  asset: string;
  /** Solana address of Milypay's shielded identity (the transfer recipient). */
  payTo: string;
  maxTimeoutSeconds: number;
  extra: RingRequirementExtra;
}

/** Inner `payload` of a PAYMENT-SIGNATURE for the private-exact scheme. */
export interface RingProof {
  /** Base58 signature of the confirmed private transfer. */
  txSignature: string;
  /** Base58 Solana address that signed that transaction (the private sender). */
  payer: string;
  /** Base58 ed25519 signature by `payer` over `ringBindingMessage(txSignature)`. */
  signature: string;
}

export interface RingPaymentPayload {
  x402Version: 2;
  accepted: RingRequirement;
  payload: RingProof;
}

export function ringBindingMessage(txSignature: string): string {
  return `milypay-ring:v1:${txSignature}`;
}

export function isRingPayload(value: unknown): value is RingPaymentPayload {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  const accepted = rec.accepted as Record<string, unknown> | undefined;
  const scheme = (accepted?.scheme ?? rec.scheme) as unknown;
  const payload = rec.payload as Record<string, unknown> | undefined;
  return (
    scheme === RING_SCHEME &&
    !!payload &&
    typeof payload.txSignature === "string" &&
    typeof payload.payer === "string" &&
    typeof payload.signature === "string"
  );
}

/** "0.002" at 6 decimals -> "2000". */
export function ringToAtomic(human: string, decimals: number): string {
  const [whole, frac = ""] = human.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return (BigInt(whole || "0") * BigInt(10) ** BigInt(decimals) + BigInt(padded || "0")).toString();
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base58Encode(bytes: Uint8Array): string {
  let n = BigInt(0);
  for (const b of bytes) n = n * BigInt(256) + BigInt(b);
  let out = "";
  while (n > BigInt(0)) {
    out = B58[Number(n % BigInt(58))] + out;
    n /= BigInt(58);
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out;
}
export function base58Decode(s: string): Uint8Array {
  let n = BigInt(0);
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("invalid base58");
    n = n * BigInt(58) + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > BigInt(0)) {
    bytes.unshift(Number(n % BigInt(256)));
    n /= BigInt(256);
  }
  for (const c of s) {
    if (c !== "1") break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}
