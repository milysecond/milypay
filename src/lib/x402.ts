// x402 payment gate for Milypay.
// Primary: Solana via PayAI facilitator (AUD stables + USDC/USDT).
// Multi-network accepts scaffold: optional Tempo (eip155:4217) when configured.
//
// Spec: client gets HTTP 402 with a base64 PAYMENT-REQUIRED challenge, pays, and retries
// with a PAYMENT-SIGNATURE header. We /verify, serve, then /settle.
// Docs: https://docs.payai.network/x402
//
// Config (Worker env / secrets):
//   X402_ENABLED      "true" to enforce payment. Anything else = pass-through (dev/testing).
//   PAYAI_FACILITATOR facilitator base URL (default https://facilitator.payai.network)
//   PAYAI_API_KEY_ID / PAYAI_API_KEY_SECRET  optional paid-tier facilitator auth
//   X402_NETWORK      CAIP-2 default Solana mainnet (legacy single-network override)
//   PAY_TO_WALLET     merchant Solana wallet that receives settlement
//   AUDD_MINT / AUDM_MINT / DAUD_MINT / USDC_MINT / USDT_MINT
//
// Tempo (optional — only advertised when BOTH are set):
//   TEMPO_X402=true          include Tempo accepts in 402 challenges
//   TEMPO_PAY_TO=0x…         EVM receive address on Tempo
//   TEMPO_NETWORK            default eip155:4217 (mainnet Presto)
//   TEMPO_PATHUSD / TEMPO_USDC  optional token address overrides
//
// NOTE: PayAI facilitator does NOT list Tempo (eip155:4217) as of 2026-08.
// TEMPO_X402 challenges will fail at /verify until a facilitator supports it.
// For live Tempo agent payments today, use MPP (mppx) — see docs/TEMPO.md.

import { NextResponse } from "next/server";
import { isThrottled } from "./throttle";
import { apiError } from "./errors";
import { payaiAuthHeaders } from "./payai-auth";
import {
  TEMPO_MAINNET_CAIP2,
  TEMPO_PATHUSD,
  TEMPO_USDC_E,
  tempoExplorerTx,
  tempoEnabled,
  tempoPayTo,
  tempoNetwork,
} from "./tempo";
import { hasMppCredential, mppCharge, mppEnabled, mppStatus } from "./mpp";
import { bazaarResourceMeta, bazaarResourceUrl, buildBazaarExtension } from "./bazaar";
import { x402FundingHint } from "./moneygram";

const FACILITATOR = process.env.PAYAI_FACILITATOR || "https://facilitator.payai.network";
const SOLANA_NETWORK =
  process.env.X402_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

// Solana mainnet mints
const USDC_MINT =
  process.env.USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT =
  process.env.USDT_MINT || "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const AUDD_MINT =
  process.env.AUDD_MINT || "AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw";
const AUDM_MINT =
  process.env.AUDM_MINT || "CiYXBwHPrdNkMtxR8YEWKv78K6bQjFoEWhPQrZqEmubi";
const DAUD_MINT =
  process.env.DAUD_MINT || "F7FiKutfrMMXd8Zw5ysZsfx5v4aBHffWc4EhRZE8NHiF";

const FEE_PAYER =
  process.env.PAYAI_FEE_PAYER || "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4";

/** One accept option in a multi-network 402 challenge. */
type AcceptedAsset = {
  network: string;
  mint: string;
  symbol: string;
  decimals: number;
  payTo: string;
  feePayer?: string;
};

function enabled(): boolean {
  return process.env.X402_ENABLED === "true";
}

/** Latin1-safe base64 for Worker btoa (Unicode in descriptions used to 500). */
function b64encode(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

function b64decodeJson<T>(s: string): T {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

/** Convert a human amount ("0.02") to atomic units for a given decimal scale. */
function toAtomic(human: string, decimals: number): string {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const base = BigInt(10) ** BigInt(decimals);
  return (BigInt(whole || "0") * base + BigInt(fracPadded || "0")).toString();
}

interface PaymentRequirements {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

/**
 * All payment rails advertised in 402 accepts[].
 * Solana first (default agent path). Tempo only when TEMPO_X402 + TEMPO_PAY_TO set.
 */
function acceptedAssets(): AcceptedAsset[] {
  const solPayTo = process.env.PAY_TO_WALLET || "";
  const out: AcceptedAsset[] = [];

  if (solPayTo) {
    const sol: Array<{ mint: string; symbol: string; decimals: number }> = [
      { mint: USDC_MINT, symbol: "USDC", decimals: 6 },
      { mint: USDT_MINT, symbol: "USDT", decimals: 6 },
      { mint: AUDD_MINT, symbol: "AUDD", decimals: 6 },
      { mint: AUDM_MINT, symbol: "AUDM", decimals: 6 },
      { mint: DAUD_MINT, symbol: "dAUD", decimals: 9 },
    ];
    for (const a of sol) {
      if (!a.mint) continue;
      out.push({
        network: SOLANA_NETWORK,
        mint: a.mint,
        symbol: a.symbol,
        decimals: a.decimals,
        payTo: solPayTo,
        feePayer: FEE_PAYER,
      });
    }
  }

  // Tempo x402 accepts (experimental — facilitator must support eip155:4217)
  if (tempoEnabled()) {
    const payTo = tempoPayTo()!;
    const net = tempoNetwork();
    const pathUsd = process.env.TEMPO_PATHUSD || TEMPO_PATHUSD;
    const usdcE = process.env.TEMPO_USDC || TEMPO_USDC_E;
    out.push({
      network: net,
      mint: pathUsd,
      symbol: "pathUSD",
      decimals: 6,
      payTo,
    });
    out.push({
      network: net,
      mint: usdcE,
      symbol: "USDC.e",
      decimals: 6,
      payTo,
    });
  }

  return out;
}

function requirementsForAsset(price: string, asset: AcceptedAsset): PaymentRequirements {
  const req: PaymentRequirements = {
    scheme: "exact",
    network: asset.network,
    amount: toAtomic(price, asset.decimals),
    asset: asset.mint,
    payTo: asset.payTo,
    maxTimeoutSeconds: 60,
  };
  if (asset.feePayer) {
    req.extra = { feePayer: asset.feePayer };
  }
  return req;
}

function allRequirements(price: string): PaymentRequirements[] {
  return acceptedAssets().map((a) => requirementsForAsset(price, a));
}

function challenge(req: Request, price: string, description: string) {
  const resourceUrl = bazaarResourceUrl(req);
  const meta = bazaarResourceMeta(description);
  const bazaar = buildBazaarExtension(req, { method: req.method || "GET" });
  const funding = x402FundingHint(price);
  return {
    x402Version: 2,
    error: "PAYMENT-SIGNATURE header is required",
    resource: {
      url: resourceUrl,
      description: meta.description,
      mimeType: meta.mimeType,
      serviceName: meta.serviceName,
      tags: meta.tags,
      iconUrl: meta.iconUrl,
    },
    accepts: allRequirements(price),
    extensions: {
      ...bazaar,
      milypayFunding: funding,
    },
  };
}

function paymentRequired(req: Request, price: string, description: string): NextResponse {
  const assets = acceptedAssets();
  const symbols = [...new Set(assets.map((a) => a.symbol))].join(" / ");
  const networks = [...new Set(assets.map((a) => a.network))];
  const funding = x402FundingHint(price);
  return apiError(
    402,
    "payment_required",
    "Payment Required",
    {
      price: `${price} ${symbols}`,
      description,
      accepts: assets.map((a) => a.symbol),
      networks,
      payTo: process.env.PAY_TO_WALLET || undefined,
      tempoPayTo: tempoEnabled() ? tempoPayTo() : undefined,
      network: networks[0] || SOLANA_NETWORK,
      facilitator: FACILITATOR,
      funding,
      howToPay: {
        step1: "If wallet USDC is low, POST /ramp/moneygram/session (or open /fund) to on-ramp via MoneyGram sandbox",
        step2: "Wait for USDC in your Solana wallet",
        step3: "Sign x402 payment for the PAYMENT-REQUIRED challenge and retry with PAYMENT-SIGNATURE",
      },
      tempo: tempoEnabled()
        ? {
            network: tempoNetwork(),
            caip2: TEMPO_MAINNET_CAIP2,
            note: "Tempo x402 requires facilitator support. Prefer MPP (mppx) for Tempo today.",
          }
        : undefined,
    },
    { "PAYMENT-REQUIRED": b64encode(challenge(req, price, description)) },
  );
}

function extractPaidAsset(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const walk = (obj: unknown, depth = 0): string | null => {
    if (!obj || typeof obj !== "object" || depth > 4) return null;
    const rec = obj as Record<string, unknown>;
    if (typeof rec.asset === "string" && rec.asset.length > 20) return rec.asset;
    for (const v of Object.values(rec)) {
      const found = walk(v, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return walk(payload);
}

function extractPaidNetwork(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const walk = (obj: unknown, depth = 0): string | null => {
    if (!obj || typeof obj !== "object" || depth > 4) return null;
    const rec = obj as Record<string, unknown>;
    if (typeof rec.network === "string" && rec.network.length > 3) return rec.network;
    for (const v of Object.values(rec)) {
      const found = walk(v, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return walk(payload);
}

function pickRequirements(price: string, payload: unknown): PaymentRequirements {
  const accepts = allRequirements(price);
  const paidAsset = extractPaidAsset(payload);
  const paidNet = extractPaidNetwork(payload);
  if (paidAsset) {
    const match = accepts.find(
      (a) =>
        a.asset === paidAsset &&
        (!paidNet || a.network === paidNet || a.network.includes(String(paidNet))),
    );
    if (match) return match;
    const byAsset = accepts.find((a) => a.asset === paidAsset);
    if (byAsset) return byAsset;
  }
  return accepts[0];
}

export interface GateOptions {
  price: string; // human amount e.g. "0.002"
  description: string; // prefer ASCII — Unicode is now safe via TextEncoder b64
  alwaysPaid?: boolean;
}

/**
 * Wrap a route handler with the payment gate.
 * - Free demo host: throttle only
 * - Paid host: MPP (Tempo) when client speaks MPP / ?rail=mpp, else x402 (Solana)
 */
export async function withX402(
  req: Request,
  opts: GateOptions,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const host = (req.headers.get("host") || "").toLowerCase();
  const paidHost = host.startsWith("api.") || opts.alwaysPaid === true;
  if (opts.alwaysPaid && !enabled() && !mppEnabled()) {
    return apiError(503, "service_unavailable", "This service is temporarily unavailable.");
  }
  if ((!enabled() && !mppEnabled()) || !paidHost) {
    if (await isThrottled(req)) {
      return apiError(
        429,
        "rate_limited",
        "Rate limit exceeded. Slow down, or use api.milypay.xyz with x402 or MPP payment.",
        { retryAfterSeconds: 60 },
        { "retry-after": "60" },
      );
    }
    return handler();
  }

  // --- MPP (Tempo) rail ---
  // Prefer MPP when Authorization: Payment is present or client asks for mpp/tempo.
  // x402 PAYMENT-SIGNATURE takes precedence for Solana agents.
  const hasX402Sig = Boolean(req.headers.get("PAYMENT-SIGNATURE"));
  if (mppEnabled() && !hasX402Sig) {
    // Only enter MPP path when credential present or explicit rail — avoid stealing x402 clients
    const url = new URL(req.url);
    const rail = (url.searchParams.get("rail") || req.headers.get("x-payment-rail") || "").toLowerCase();
    const wantMpp = hasMppCredential(req) || rail === "mpp" || rail === "tempo";
    if (wantMpp) {
      const mpp = await mppCharge(req, opts.price, { forceChallenge: true });
      if (mpp.kind === "error") {
        return new NextResponse(mpp.response.body, {
          status: mpp.response.status,
          headers: mpp.response.headers,
        });
      }
      if (mpp.kind === "challenge") {
        return new NextResponse(mpp.response.body, {
          status: 402,
          headers: mpp.response.headers,
        });
      }
      if (mpp.kind === "paid") {
        const res = await handler();
        if (!res.ok) return res;
        const paid = mpp.withReceipt(res);
        return paid instanceof NextResponse
          ? paid
          : new NextResponse(paid.body, { status: paid.status, headers: paid.headers });
      }
    }
  }

  // --- x402 (Solana) rail ---
  if (!enabled()) {
    // MPP-only deployment without x402
    if (mppEnabled()) {
      const mpp = await mppCharge(req, opts.price, { forceChallenge: true });
      if (mpp.kind === "challenge") {
        return new NextResponse(mpp.response.body, {
          status: 402,
          headers: mpp.response.headers,
        });
      }
      if (mpp.kind === "paid") {
        const res = await handler();
        const paid = mpp.withReceipt(res);
        return paid instanceof NextResponse
          ? paid
          : new NextResponse(paid.body, { status: paid.status, headers: paid.headers });
      }
    }
    return apiError(503, "payment_not_configured", "Payment not configured");
  }

  if (!process.env.PAY_TO_WALLET && !tempoEnabled()) {
    return apiError(503, "payment_not_configured", "Payment not configured");
  }
  if (allRequirements(opts.price).length === 0) {
    return apiError(503, "payment_not_configured", "No settlement assets configured");
  }

  const sig = req.headers.get("PAYMENT-SIGNATURE");
  if (!sig) return paymentRequired(req, opts.price, opts.description);

  let payload: unknown;
  try {
    payload = b64decodeJson(sig);
  } catch {
    return paymentRequired(req, opts.price, opts.description);
  }

  const reqs = pickRequirements(opts.price, payload);

  try {
    const auth = await payaiAuthHeaders();
    const vr = await fetch(`${FACILITATOR}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", ...auth },
      body: JSON.stringify({ paymentPayload: payload, paymentRequirements: reqs }),
    });
    const verify = (await vr.json()) as { isValid?: boolean };
    if (!vr.ok || !verify.isValid) {
      let ok = false;
      for (const alt of allRequirements(opts.price)) {
        if (alt.asset === reqs.asset && alt.network === reqs.network) continue;
        const vr2 = await fetch(`${FACILITATOR}/verify`, {
          method: "POST",
          headers: { "content-type": "application/json", ...auth },
          body: JSON.stringify({ paymentPayload: payload, paymentRequirements: alt }),
        });
        const v2 = (await vr2.json()) as { isValid?: boolean };
        if (vr2.ok && v2.isValid) {
          ok = true;
          Object.assign(reqs, alt);
          break;
        }
      }
      if (!ok) return paymentRequired(req, opts.price, opts.description);
    }
  } catch {
    return apiError(502, "verification_unavailable", "Verification unavailable");
  }

  const res = await handler();
  if (!res.ok) return res;

  try {
    const auth = await payaiAuthHeaders();
    const sr = await fetch(`${FACILITATOR}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json", ...auth },
      body: JSON.stringify({ paymentPayload: payload, paymentRequirements: reqs }),
    });
    const settlement = (await sr.json()) as Record<string, unknown>;
    const receipt = buildReceipt(settlement, reqs);
    res.headers.set("PAYMENT-RESPONSE", b64encode(settlement));
    if (receipt.signature) {
      res.headers.set("X-Milypay-Tx", receipt.signature);
      res.headers.set("X-Milypay-Explorer", receipt.explorerUrl || "");
    }
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await res.clone().json();
        if (body && typeof body === "object" && !Array.isArray(body)) {
          return NextResponse.json(
            { ...(body as object), $receipt: receipt },
            { status: res.status, headers: res.headers },
          );
        }
      }
    } catch {
      /* leave original body */
    }
  } catch {
    console.error("x402 settle failed");
  }

  return res;
}

function buildReceipt(
  settlement: Record<string, unknown>,
  reqs: PaymentRequirements,
): {
  signature?: string;
  explorerUrl?: string;
  /** @deprecated alias — same as explorerUrl */
  solNewUrl?: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  brand: "Milypay";
} {
  let sig: string | undefined;
  if (typeof settlement.transaction === "string") sig = settlement.transaction;
  else if (typeof settlement.signature === "string") sig = settlement.signature;
  else if (typeof settlement.txHash === "string") sig = settlement.txHash;
  else if (
    settlement.transaction &&
    typeof settlement.transaction === "object" &&
    typeof (settlement.transaction as { signature?: string }).signature === "string"
  ) {
    sig = (settlement.transaction as { signature: string }).signature;
  }
  const network = reqs.network || SOLANA_NETWORK;
  let explorerUrl: string | undefined;
  if (sig) {
    if (network.startsWith("eip155:") || network.includes("tempo")) {
      explorerUrl = tempoExplorerTx(sig);
    } else {
      explorerUrl = `https://sol.new/receipt/${sig}`;
    }
  }
  return {
    signature: typeof sig === "string" ? sig : undefined,
    explorerUrl,
    solNewUrl: explorerUrl,
    network,
    asset: reqs.asset,
    amount: reqs.amount,
    payTo: reqs.payTo,
    brand: "Milypay",
  };
}

/** Status helper for /api/status and /ops */
export function paymentRailsStatus() {
  return {
    x402Enabled: enabled(),
    solana: {
      network: SOLANA_NETWORK,
      payToConfigured: Boolean(process.env.PAY_TO_WALLET),
      assets: acceptedAssets()
        .filter((a) => a.network === SOLANA_NETWORK)
        .map((a) => a.symbol),
    },
    tempo: {
      configured: tempoEnabled(),
      network: tempoEnabled() ? tempoNetwork() : TEMPO_MAINNET_CAIP2,
      payTo: tempoEnabled() ? tempoPayTo() : null,
      x402Flag: process.env.TEMPO_X402 === "true",
      facilitatorSupportsTempo: false,
      preferredPath: "MPP (mppx)",
      mpp: mppStatus(),
    },
  };
}
