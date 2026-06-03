// x402 payment gate for MilyPay, settling in AUDD on Solana via the PayAI facilitator.
// Spec: client gets HTTP 402 with a base64 PAYMENT-REQUIRED challenge, pays, and retries
// with a PAYMENT-SIGNATURE header. We /verify, serve, then /settle.
// Docs: https://docs.payai.network/x402
//
// Config (Worker env / secrets):
//   X402_ENABLED      "true" to enforce payment. Anything else = pass-through (dev/testing).
//   PAYAI_FACILITATOR facilitator base URL (default https://facilitator.payai.network)
//   X402_NETWORK      CAIP-2 network id (default Solana mainnet)
//   PAY_TO_WALLET     merchant Solana wallet that receives AUDD
//   AUDD_MINT         AUDD SPL token mint address on Solana
//   AUDD_DECIMALS     token decimals (default 6)

import { NextResponse } from "next/server";
import { isThrottled } from "./throttle";

const FACILITATOR = process.env.PAYAI_FACILITATOR || "https://facilitator.payai.network";
const NETWORK = process.env.X402_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
const DECIMALS = Number(process.env.AUDD_DECIMALS || "6");

function enabled(): boolean {
  return process.env.X402_ENABLED === "true";
}

function b64encode(obj: unknown): string {
  return btoa(JSON.stringify(obj));
}

function b64decodeJson<T>(s: string): T {
  return JSON.parse(atob(s)) as T;
}

// Convert a human AUD amount ("0.02") to atomic token units as a string.
function toAtomic(human: string): string {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = (frac + "0".repeat(DECIMALS)).slice(0, DECIMALS);
  const base = BigInt(10) ** BigInt(DECIMALS);
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

function requirements(price: string): PaymentRequirements {
  return {
    scheme: "exact",
    network: NETWORK,
    amount: toAtomic(price),
    asset: process.env.AUDD_MINT || "",
    payTo: process.env.PAY_TO_WALLET || "",
    maxTimeoutSeconds: 60,
    extra: {
      feePayer: process.env.PAYAI_FEE_PAYER || "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4",
    },
  };
}

function challenge(req: Request, price: string, description: string) {
  return {
    x402Version: 2,
    error: "PAYMENT-SIGNATURE header is required",
    resource: { url: req.url, description, mimeType: "application/json" },
    accepts: [requirements(price)],
    extensions: {},
  };
}

function paymentRequired(req: Request, price: string, description: string): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: "Payment Required", price: `${price} AUDD`, description }),
    {
      status: 402,
      headers: {
        "content-type": "application/json",
        "PAYMENT-REQUIRED": b64encode(challenge(req, price, description)),
      },
    },
  );
}

export interface GateOptions {
  price: string; // human AUD amount, e.g. "0.02"
  description: string;
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
  const paidHost = host.startsWith("api.");
  if (!enabled() || !paidHost) {
    if (await isThrottled(req)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Slow down, or use api.milypay.xyz with x402 payment." },
        { status: 429, headers: { "retry-after": "60" } },
      );
    }
    return handler();
  }

  if (!process.env.PAY_TO_WALLET || !process.env.AUDD_MINT) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  const sig = req.headers.get("PAYMENT-SIGNATURE");
  if (!sig) return paymentRequired(req, opts.price, opts.description);

  const reqs = requirements(opts.price);
  let payload: unknown;
  try {
    payload = b64decodeJson(sig);
  } catch {
    return paymentRequired(req, opts.price, opts.description);
  }

  // 1. Verify the payment proof with the facilitator.
  try {
    const vr = await fetch(`${FACILITATOR}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentPayload: payload, paymentRequirements: reqs }),
    });
    const verify = (await vr.json()) as { isValid?: boolean };
    if (!vr.ok || !verify.isValid) return paymentRequired(req, opts.price, opts.description);
  } catch {
    return NextResponse.json({ error: "Verification unavailable" }, { status: 502 });
  }

  // 2. Serve the resource.
  const res = await handler();

  // 3. Settle on-chain and attach the settlement receipt.
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
