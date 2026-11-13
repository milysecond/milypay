// x402 facilitator protocol helpers (no Next.js imports — unit-tested directly).
//
// PayAI rotates the Solana exact fee payer. GET {facilitator}/supported is the
// source of truth; a hardcoded address goes stale and verify rejects the tx
// because the sponsor in the challenge does not match the facilitator signer.

export const FEE_PAYER_TTL_MS = 60_000;

/** Public PayAI exact fee payers, used only when /supported cannot be read. */
export const PAYAI_MAINNET_FEE_PAYER_FALLBACK =
  "CjNFTjvBhbJJd2B5ePPMHRLx1ELZpa8dwQgGL727eKww";
export const PAYAI_DEVNET_FEE_PAYER_FALLBACK =
  "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4";

export const SOLANA_MAINNET_CAIP = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const SOLANA_DEVNET_CAIP = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

export interface SupportedKind {
  x402Version?: number;
  scheme?: string;
  network?: string;
  extra?: { feePayer?: string } & Record<string, unknown>;
}

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export type PaymentHeaderVia = "PAYMENT-SIGNATURE" | "X-PAYMENT";

type CanonicalSolana = "mainnet" | "devnet";

let cachedKinds: { at: number; kinds: SupportedKind[] } | null = null;
let inflight: Promise<SupportedKind[] | null> | null = null;

export function resetFeePayerCacheForTests(): void {
  cachedKinds = null;
  inflight = null;
}

export function canonicalSolana(network: string): CanonicalSolana | null {
  if (network === "solana" || network === SOLANA_MAINNET_CAIP) return "mainnet";
  if (network === "solana-devnet" || network === SOLANA_DEVNET_CAIP) return "devnet";
  return null;
}

export function isSolanaNetwork(network: string): boolean {
  return canonicalSolana(network) !== null || network.startsWith("solana:");
}

/** True when both ids are the same chain, including v1 names and CAIP-2. */
export function networksMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const ca = canonicalSolana(a);
  const cb = canonicalSolana(b);
  return ca !== null && ca === cb;
}

export function networkForVersion(network: string, version: 1 | 2): string {
  const chain = canonicalSolana(network);
  if (!chain) return network;
  if (version === 1) return chain === "mainnet" ? "solana" : "solana-devnet";
  return chain === "mainnet" ? SOLANA_MAINNET_CAIP : SOLANA_DEVNET_CAIP;
}

function aliasNetworks(network: string): string[] {
  const chain = canonicalSolana(network);
  if (chain === "mainnet") return [SOLANA_MAINNET_CAIP, "solana"];
  if (chain === "devnet") return [SOLANA_DEVNET_CAIP, "solana-devnet"];
  return [network];
}

/**
 * Fee payer for `network` from a facilitator's /supported kinds.
 * Prefers scheme "exact" and x402 v2 on an exact network id, then v1 aliases.
 */
export function selectFeePayer(
  kinds: readonly SupportedKind[],
  network: string,
  scheme = "exact",
): string | null {
  const wanted = new Set(aliasNetworks(network));
  const matches = kinds.filter((k) => {
    if ((k.scheme || "exact") !== scheme) return false;
    if (!k.network || !wanted.has(k.network)) return false;
    return typeof k.extra?.feePayer === "string" && k.extra.feePayer.length > 0;
  });
  if (!matches.length) return null;
  const exactNet = matches.filter((k) => k.network === network);
  const pool = exactNet.length ? exactNet : matches;
  const v2 = pool.filter((k) => k.x402Version === 2);
  const chosen = (v2.length ? v2 : pool)[0];
  return chosen?.extra?.feePayer ?? null;
}

/** Used when /supported is unreachable and there is no fresher cached payer. */
export function fallbackFeePayer(network: string, envFallback?: string): string {
  const env = envFallback?.trim();
  if (env) return env;
  return canonicalSolana(network) === "devnet"
    ? PAYAI_DEVNET_FEE_PAYER_FALLBACK
    : PAYAI_MAINNET_FEE_PAYER_FALLBACK;
}

export interface FeePayerDeps {
  facilitator: string;
  fetchImpl?: typeof fetch;
  authHeaders?: () => Promise<Record<string, string>>;
  now?: () => number;
  envFallback?: string;
  ttlMs?: number;
}

async function fetchSupported(
  facilitator: string,
  fetchImpl: typeof fetch,
  headers: Record<string, string>,
): Promise<SupportedKind[] | null> {
  const url = `${facilitator.replace(/\/$/, "")}/supported`;
  try {
    const res = await fetchImpl(url, {
      method: "GET",
      headers: { accept: "application/json", ...headers },
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { kinds?: unknown } | unknown[];
    const kinds = Array.isArray(body) ? body : body?.kinds;
    if (!Array.isArray(kinds)) return null;
    return kinds as SupportedKind[];
  } catch {
    return null;
  }
}

async function loadSupportedKinds(
  deps: FeePayerDeps,
  now: number,
  ttlMs: number,
): Promise<SupportedKind[] | null> {
  if (cachedKinds && now - cachedKinds.at < ttlMs) return cachedKinds.kinds;
  if (!inflight) {
    const fetchImpl = deps.fetchImpl ?? fetch;
    inflight = (async () => {
      let auth: Record<string, string> = {};
      try {
        auth = deps.authHeaders ? await deps.authHeaders() : {};
      } catch {
        auth = {};
      }
      let kinds = await fetchSupported(deps.facilitator, fetchImpl, auth);
      // An invalid merchant JWT must not hide the public shared-lane payer.
      if (!kinds && Object.keys(auth).length > 0) {
        kinds = await fetchSupported(deps.facilitator, fetchImpl, {});
      }
      if (kinds) cachedKinds = { at: now, kinds };
      return kinds;
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/**
 * Current exact fee payer for `network`.
 * Order: fresh /supported, last good cache, PAYAI_FEE_PAYER, built-in public payer.
 */
export async function resolveFeePayer(network: string, deps: FeePayerDeps): Promise<string> {
  const ttlMs = deps.ttlMs ?? FEE_PAYER_TTL_MS;
  const now = deps.now?.() ?? Date.now();
  const kinds = await loadSupportedKinds(deps, now, ttlMs);
  const selected = kinds ? selectFeePayer(kinds, network) : null;
  if (selected) return selected;
  if (cachedKinds) {
    const stale = selectFeePayer(cachedKinds.kinds, network);
    if (stale) return stale;
  }
  return fallbackFeePayer(network, deps.envFallback);
}

/** v2 PAYMENT-SIGNATURE wins; v1 clients send X-PAYMENT (already CORS-allowed). */
export function readPaymentHeader(headers: Headers): { raw: string; via: PaymentHeaderVia } | null {
  const v2 = headers.get("PAYMENT-SIGNATURE");
  if (v2) return { raw: v2, via: "PAYMENT-SIGNATURE" };
  const v1 = headers.get("X-PAYMENT");
  if (v1) return { raw: v1, via: "X-PAYMENT" };
  return null;
}

/** v1 payloads are flat {scheme, network, payload}; v2 nests requirements under accepted. */
export function paymentVersion(payload: unknown): 1 | 2 {
  if (!payload || typeof payload !== "object") return 2;
  const rec = payload as Record<string, unknown>;
  if (rec.x402Version === 1) return 1;
  if (rec.x402Version === 2) return 2;
  if (rec.accepted && typeof rec.accepted === "object") return 2;
  if (typeof rec.scheme === "string" && typeof rec.network === "string") return 1;
  return 2;
}

export interface FacilitatorRequest {
  x402Version: 1 | 2;
  paymentPayload: unknown;
  paymentRequirements: Record<string, unknown>;
}

/**
 * Body for POST /verify and POST /settle.
 * v1 facilitators require maxAmountRequired plus a v1 network name ("solana").
 * v2 uses amount and CAIP-2. Solana extra.feePayer is always the resolved payer.
 */
export function prepareFacilitatorRequest(args: {
  version: 1 | 2;
  payload: unknown;
  requirements: PaymentRequirements;
  resource: { url: string; description: string; mimeType?: string };
  feePayer?: string;
}): FacilitatorRequest {
  const network = networkForVersion(args.requirements.network, args.version);
  const extra: Record<string, unknown> = { ...(args.requirements.extra ?? {}) };
  if (args.feePayer && isSolanaNetwork(args.requirements.network)) {
    extra.feePayer = args.feePayer;
  }
  const hasExtra = Object.keys(extra).length > 0;

  if (args.version === 1) {
    return {
      x402Version: 1,
      paymentPayload: args.payload,
      paymentRequirements: {
        scheme: args.requirements.scheme,
        network,
        maxAmountRequired: args.requirements.amount,
        resource: args.resource.url,
        description: args.resource.description || "Milypay",
        mimeType: args.resource.mimeType || "application/json",
        payTo: args.requirements.payTo,
        maxTimeoutSeconds: args.requirements.maxTimeoutSeconds,
        asset: args.requirements.asset,
        ...(hasExtra ? { extra } : {}),
      },
    };
  }

  return {
    x402Version: 2,
    paymentPayload: args.payload,
    paymentRequirements: {
      scheme: args.requirements.scheme,
      network,
      amount: args.requirements.amount,
      asset: args.requirements.asset,
      payTo: args.requirements.payTo,
      maxTimeoutSeconds: args.requirements.maxTimeoutSeconds,
      ...(hasExtra ? { extra } : {}),
    },
  };
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function formatMessage(value: unknown): string | null {
  if (typeof value === "string") return asString(value);
  if (Array.isArray(value)) {
    const parts = value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
    return parts.length ? parts.join("; ") : null;
  }
  return null;
}

/** Human-readable facilitator verify/settle failure, preferring machine reason codes. */
export function facilitatorFailureReason(body: unknown, status?: number): string {
  const fallback = status ? `facilitator HTTP ${status}` : "payment verification failed";
  if (!body || typeof body !== "object") return fallback;
  const rec = body as Record<string, unknown>;
  const code = asString(rec.invalidReason) || asString(rec.errorReason);
  const human = asString(rec.invalidMessage) || asString(rec.errorMessage);
  const message = formatMessage(rec.message);
  const parts: string[] = [];
  for (const part of [code, human, message]) {
    if (part && !parts.includes(part)) parts.push(part);
  }
  if (parts.length) return parts.join(": ");
  const err = asString(rec.error);
  if (err && err !== "Bad Request") return err;
  return fallback;
}

export function verifySucceeded(httpOk: boolean, body: unknown): boolean {
  if (!httpOk || !body || typeof body !== "object") return false;
  return (body as { isValid?: unknown }).isValid === true;
}

/**
 * Deliver the resource only when the facilitator reports success.
 * An explicit success:false is a failure even if HTTP is 200 (PayAI does this).
 * A 200 body with a transaction id and no success flag is treated as settled.
 */
export function settlementSucceeded(httpOk: boolean, body: unknown): boolean {
  if (!httpOk || !body || typeof body !== "object") return false;
  const rec = body as Record<string, unknown>;
  if (rec.success === true) return true;
  if (rec.success === false) return false;
  const tx = rec.transaction ?? rec.signature ?? rec.txHash;
  return typeof tx === "string" && tx.length > 0;
}

const SECRET_KEY = /authorization|api[-_]?key|secret|password|private|bearer|token/i;

/** Copy a facilitator response for logs. Drops secret-like keys and clips huge strings. */
export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeForLog(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEY.test(key) ? "[redacted]" : sanitizeForLog(inner, depth + 1);
    }
    return out;
  }
  return undefined;
}
