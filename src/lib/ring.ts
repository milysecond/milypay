/**
 * Helius Privacy Rings payment rail (beta) — "confidential, not anonymous".
 *
 * Payers send a private transfer inside the Helius Default Ring to Milypay's
 * shielded address; the asset and amount are hidden on-chain, sender and
 * recipient are not. The 402 challenge advertises a `private-exact` accepts[]
 * entry (rail `helius-rings`) per accepted ring asset. The client retries with a
 * PAYMENT-SIGNATURE whose payload is {txSignature, payer, signature} where
 * `signature` is the payer's ed25519 signature over `milypay-ring:v1:<txSignature>`.
 *
 * Verification (decrypting with Milypay's viewing key) runs in the private
 * `milypay-ring` Worker (service binding RING) because the Rings SDK needs
 * precompiled WASM. Replay protection + a retry window live in its D1 table.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  MILYPAY_RING_ENDPOINTS,
  RING_LABEL,
  RING_MINTS,
  RING_PRIVACY,
  RING_PROGRAM_ID,
  RING_PROTOCOL_VERSION,
  RING_RAIL,
  RING_RETRY_WINDOW_SECONDS,
  RING_SCHEME,
  SOLANA_MAINNET_CAIP2,
  isRingPayload,
  ringBindingMessage,
  ringToAtomic,
  type RingPaymentPayload,
  type RingRequirement,
  type RingSymbol,
} from "../../ring/src/protocol";

export { isRingPayload, RING_SCHEME, RING_RAIL, RING_LABEL, RING_PRIVACY };
export type { RingPaymentPayload, RingRequirement };

export const RING_DOCS_URL = "https://milypay.xyz/docs/ring";

interface ServiceBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

function ringService(): ServiceBinding | null {
  try {
    const { env } = getCloudflareContext();
    const svc = (env as unknown as { RING?: ServiceBinding }).RING;
    return svc && typeof svc.fetch === "function" ? svc : null;
  } catch {
    return null;
  }
}

export function ringEnabled(): boolean {
  return (
    process.env.RING_ENABLED === "true" &&
    Boolean(process.env.RING_SHIELDED_ADDRESS) &&
    Boolean(process.env.RING_PAY_TO)
  );
}

export function ringAssets(): RingSymbol[] {
  const raw = (process.env.RING_ASSETS || "USDC,AUDD").split(",").map((s) => s.trim().toUpperCase());
  return raw.filter((s): s is RingSymbol => s in RING_MINTS);
}

/** private-exact accepts[] entries for a human price (e.g. "0.002"). Empty when disabled. */
export function ringRequirements(price: string): RingRequirement[] {
  if (!ringEnabled()) return [];
  const shielded = process.env.RING_SHIELDED_ADDRESS as string;
  const payTo = process.env.RING_PAY_TO as string;
  return ringAssets().map((symbol) => {
    const { mint, decimals } = RING_MINTS[symbol];
    return {
      scheme: RING_SCHEME,
      network: SOLANA_MAINNET_CAIP2,
      amount: ringToAtomic(price, decimals),
      asset: mint,
      payTo,
      maxTimeoutSeconds: RING_RETRY_WINDOW_SECONDS,
      extra: {
        rail: RING_RAIL,
        label: RING_LABEL,
        privacy: RING_PRIVACY,
        version: RING_PROTOCOL_VERSION,
        ring: "default",
        programId: RING_PROGRAM_ID,
        shieldedAddress: shielded,
        symbol,
        decimals,
        endpoints: { ...MILYPAY_RING_ENDPOINTS },
        binding: ringBindingMessage("<txSignature>"),
        retryWindowSeconds: RING_RETRY_WINDOW_SECONDS,
        docs: RING_DOCS_URL,
      },
    };
  });
}

/** Human-readable summary for 402 JSON bodies, manifest and /status. */
export function ringSummary() {
  return {
    rail: RING_RAIL,
    scheme: RING_SCHEME,
    label: RING_LABEL,
    privacy: RING_PRIVACY,
    enabled: ringEnabled(),
    assets: ringAssets(),
    payTo: process.env.RING_PAY_TO || null,
    endpoints: MILYPAY_RING_ENDPOINTS,
    retryWindowSeconds: RING_RETRY_WINDOW_SECONDS,
    docs: RING_DOCS_URL,
    note:
      "Private transfer in the Helius Default Ring: asset and amount are hidden on-chain; sender and recipient are public. Beta.",
  };
}

export type RingVerifyOutcome =
  | { ok: true; amount: string; retry: boolean; attempts: number }
  | { ok: false; status: number; code: string; message: string; retryable: boolean };

async function callRing(path: string, body: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
  const svc = ringService();
  if (!svc) return { status: 503, json: { ok: false, code: "ring_unavailable", message: "ring verifier not bound", retryable: true } };
  const res = await svc.fetch(`https://milypay-ring.internal${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!json || typeof json.ok !== "boolean") {
    return { status: 503, json: { ok: false, code: "verification_unavailable", message: "ring verifier unavailable", retryable: true } };
  }
  return { status: res.status, json };
}

export async function ringVerify(
  payload: RingPaymentPayload,
  price: string,
  resource: string,
  method: string,
): Promise<RingVerifyOutcome> {
  const asset = payload.accepted?.asset;
  const entry = Object.values(RING_MINTS).find((m) => m.mint === asset);
  if (!entry || !ringAssets().some((s) => RING_MINTS[s].mint === asset)) {
    return { ok: false, status: 402, code: "unsupported_asset", message: "asset not accepted on the ring rail", retryable: false };
  }
  try {
    const { status, json } = await callRing("/internal/verify", {
      ...payload.payload,
      mint: asset,
      required: ringToAtomic(price, entry.decimals),
      resource,
      method,
    });
    if (json.ok === true) {
      return { ok: true, amount: String(json.amount), retry: Boolean(json.retry), attempts: Number(json.attempts || 1) };
    }
    return {
      ok: false,
      status,
      code: String(json.code || "ring_verify_failed"),
      message: String(json.message || "ring payment could not be verified"),
      retryable: Boolean(json.retryable),
    };
  } catch (e) {
    console.error("ring verify unavailable", e instanceof Error ? e.message : "error");
    return { ok: false, status: 502, code: "verification_unavailable", message: "ring verifier unavailable", retryable: true };
  }
}

export async function ringMark(txSignature: string, served: boolean): Promise<void> {
  try {
    await callRing(served ? "/internal/served" : "/internal/release", { txSignature });
  } catch (e) {
    console.error("ring mark failed", e instanceof Error ? e.message : "error");
  }
}

/** Forward a public /ring/* proxy request to the ring Worker. */
export async function ringProxy(req: Request, subpath: string): Promise<Response> {
  const svc = ringService();
  if (!svc) return Response.json({ error: "ring proxy unavailable" }, { status: 503 });
  const url = new URL(req.url);
  const headers = new Headers();
  for (const h of ["content-type", "spr-tee", "spr-tee-enc", "spr-tee-ciphertext", "accept"]) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("x-milypay-client-ip", req.headers.get("cf-connecting-ip") || "unknown");
  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") init.body = await req.arrayBuffer();
  return svc.fetch(`https://milypay-ring.internal/proxy/${subpath}${url.search}`, init);
}
