// x402 payment gate for Milypay on Solana via the PayAI facilitator.
// Accepts AUD stables (AUDD, AUDM, dAUD) plus USDC/USDT for pay-skills / pay.sh.
// Spec: client gets HTTP 402 with a base64 PAYMENT-REQUIRED challenge, pays, and retries
// with a PAYMENT-SIGNATURE header. We /verify, serve, then /settle.
// Docs: https://docs.payai.network/x402
//
// Config (Worker env / secrets):
//   X402_ENABLED      "true" to enforce payment. Anything else = pass-through (dev/testing).
//   PAYAI_FACILITATOR facilitator base URL (default https://facilitator.payai.network)
//   X402_NETWORK      CAIP-2 network id (default Solana mainnet)
//   PAY_TO_WALLET     merchant Solana wallet that receives settlement
//   AUDD_MINT         AUDD mint (default Novatti on Solana)
//   AUDM_MINT         AUDM mint (default Macropod on Solana)
//   DAUD_MINT         dAUD mint (default New Money on Solana)
//   USDC_MINT / USDT_MINT optional overrides

import { NextResponse } from "next/server";
import { isThrottled } from "./throttle";

const FACILITATOR = process.env.PAYAI_FACILITATOR || "https://facilitator.payai.network";
const NETWORK = process.env.X402_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

// Solana mainnet mints
const USDC_MINT =
  process.env.USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT =
  process.env.USDT_MINT || "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const AUDD_MINT =
  process.env.AUDD_MINT || "AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw";
// Macropod AUDM (Token-2022) — CoinGecko / stablesonsolana
const AUDM_MINT =
  process.env.AUDM_MINT || "CiYXBwHPrdNkMtxR8YEWKv78K6bQjFoEWhPQrZqEmubi";
// New Money dAUD — 9 decimals
const DAUD_MINT =
  process.env.DAUD_MINT || "F7FiKutfrMMXd8Zw5ysZsfx5v4aBHffWc4EhRZE8NHiF";

const FEE_PAYER =
  process.env.PAYAI_FEE_PAYER || "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4";

type AcceptedAsset = { mint: string; symbol: string; decimals: number };

function enabled(): boolean {
  return process.env.X402_ENABLED === "true";
}

function b64encode(obj: unknown): string {
  return btoa(JSON.stringify(obj));
}

function b64decodeJson<T>(s: string): T {
  return JSON.parse(atob(s)) as T;
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
 * Stables Milypay accepts on Solana.
 * Order: USDC/USDT first (pay-skills CI), then AUD-native rails (AUDD, AUDM, dAUD).
 */
function acceptedAssets(): AcceptedAsset[] {
  return [
    { mint: USDC_MINT, symbol: "USDC", decimals: 6 },
    { mint: USDT_MINT, symbol: "USDT", decimals: 6 },
    { mint: AUDD_MINT, symbol: "AUDD", decimals: 6 },
    { mint: AUDM_MINT, symbol: "AUDM", decimals: 6 },
    { mint: DAUD_MINT, symbol: "dAUD", decimals: 9 },
  ].filter((a) => Boolean(a.mint));
}

function requirementsForAsset(
  price: string,
  asset: AcceptedAsset,
): PaymentRequirements {
  return {
    scheme: "exact",
    network: NETWORK,
    amount: toAtomic(price, asset.decimals),
    asset: asset.mint,
    payTo: process.env.PAY_TO_WALLET || "",
    maxTimeoutSeconds: 60,
    extra: { feePayer: FEE_PAYER },
  };
}

function allRequirements(price: string): PaymentRequirements[] {
  return acceptedAssets().map((a) => requirementsForAsset(price, a));
}

function challenge(req: Request, price: string, description: string) {
  return {
    x402Version: 2,
    error: "PAYMENT-SIGNATURE header is required",
    resource: { url: req.url, description, mimeType: "application/json" },
    // USDC first so pay-skills probes recognize a Solana USDC/USDT accept.
    accepts: allRequirements(price),
    extensions: {},
  };
}

function paymentRequired(req: Request, price: string, description: string): NextResponse {
  const symbols = acceptedAssets()
    .map((a) => a.symbol)
    .join(" / ");
  return new NextResponse(
    JSON.stringify({
      error: "Payment Required",
      price: `${price} ${symbols}`,
      description,
      brand: "Milypay",
    }),
    {
      status: 402,
      headers: {
        "content-type": "application/json",
        "PAYMENT-REQUIRED": b64encode(challenge(req, price, description)),
      },
    },
  );
}

/** Best-effort extract of the paid asset mint from a payment payload. */
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

function pickRequirements(price: string, payload: unknown): PaymentRequirements {
  const accepts = allRequirements(price);
  const paid = extractPaidAsset(payload);
  if (paid) {
    const match = accepts.find((a) => a.asset === paid);
    if (match) return match;
  }
  // Default to USDC (first accept) for facilitator calls when shape is unknown.
  return accepts[0];
}

export interface GateOptions {
  price: string; // human amount in AUD-equivalent units, e.g. "0.002"
  description: string;
  // Always require payment (even on the website host). Use for services that cost us
  // money upstream (e.g. resold third-party APIs) so the free host can't drain funds.
  alwaysPaid?: boolean;
}

/**
 * Wrap a route handler with the x402 payment gate.
 * When X402_ENABLED !== "true", the handler runs free (data layer testing).
 */
export async function withX402(
  req: Request,
  opts: GateOptions,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  // Payments are enforced only on the API host (api.milypay.xyz). The website and demo
  // (milypay.xyz/api/*) stay free - just per-IP throttled - as does the off state.
  const host = (req.headers.get("host") || "").toLowerCase();
  const paidHost = host.startsWith("api.") || opts.alwaysPaid === true;
  // A service that costs us money upstream (alwaysPaid) must NEVER be served free.
  // If payments are off, refuse rather than fall through to the free path.
  if (opts.alwaysPaid && !enabled()) {
    return NextResponse.json({ error: "This service is temporarily unavailable." }, { status: 503 });
  }
  if (!enabled() || !paidHost) {
    if (await isThrottled(req)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Slow down, or use api.milypay.xyz with x402 payment." },
        { status: 429, headers: { "retry-after": "60" } },
      );
    }
    return handler();
  }

  if (!process.env.PAY_TO_WALLET) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }
  if (allRequirements(opts.price).length === 0) {
    return NextResponse.json({ error: "No settlement assets configured" }, { status: 503 });
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

  // 1. Verify the payment proof with the facilitator.
  try {
    const vr = await fetch(`${FACILITATOR}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentPayload: payload, paymentRequirements: reqs }),
    });
    const verify = (await vr.json()) as { isValid?: boolean };
    if (!vr.ok || !verify.isValid) {
      // Retry against each accepted asset if the first match failed.
      let ok = false;
      for (const alt of allRequirements(opts.price)) {
        if (alt.asset === reqs.asset) continue;
        const vr2 = await fetch(`${FACILITATOR}/verify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
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
    return NextResponse.json({ error: "Verification unavailable" }, { status: 502 });
  }

  // 2. Serve the resource.
  const res = await handler();

  // 3. Settle only on success. Failed upstream (4xx/5xx) must not charge the agent.
  if (!res.ok) return res;

  try {
    const sr = await fetch(`${FACILITATOR}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentPayload: payload, paymentRequirements: reqs }),
    });
    const settlement = await sr.json();
    res.headers.set("PAYMENT-RESPONSE", b64encode(settlement));
  } catch {
    // Resource already served; settlement issues are logged, not surfaced to the agent.
    console.error("x402 settle failed");
  }

  return res;
}
