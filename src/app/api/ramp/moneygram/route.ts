import { NextResponse } from "next/server";
import {
  createMoneyGramSession,
  moneygramEnv,
  moneygramConfigured,
  moneygramHasLocalKeys,
  type RampMode,
} from "@/lib/moneygram";

export const dynamic = "force-dynamic";

/**
 * GET /ramp/moneygram — catalogue / status
 * POST /ramp/moneygram/session — create MG session for demo funding
 */
export async function GET() {
  return NextResponse.json({
    brand: "Milypay",
    service: "ramp/moneygram",
    role: "fund_wallet_before_x402",
    configured: moneygramConfigured(),
    localKeys: moneygramHasLocalKeys(),
    env: moneygramEnv(),
    demo: moneygramEnv() === "sandbox" || !moneygramHasLocalKeys(),
    endpoints: [
      {
        path: "/ramp/moneygram",
        method: "GET",
        description: "Status",
      },
      {
        path: "/ramp/moneygram/session",
        method: "POST",
        body: { mode: "on-ramp | off-ramp" },
        description: "Create MoneyGram widget session (sandbox/demo)",
      },
    ],
    flow: [
      "Hit any paid Milypay API → HTTP 402",
      "If underfunded: POST /ramp/moneygram/session",
      "Open widgetUrl (MoneyGram sandbox) → get USDC",
      "Retry API with x402 PAYMENT-SIGNATURE",
    ],
    demoUi: "https://milypay.xyz/fund",
    note: "MoneyGram does not settle x402. It only funds the wallet.",
  });
}

export async function POST(req: Request) {
  let mode: RampMode = "on-ramp";
  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: string };
    if (body.mode === "off-ramp" || body.mode === "offramp") mode = "off-ramp";
  } catch {
    /* empty */
  }

  try {
    const session = await createMoneyGramSession(mode);
    return NextResponse.json({
      ok: true,
      ...session,
      next: [
        "Open widgetUrl in browser (or load sdkUrl + sessionToken)",
        "Complete MoneyGram sandbox flow into your Solana wallet",
        "Retry the original 402 endpoint with PAYMENT-SIGNATURE",
      ],
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "session_failed",
        brand: "Milypay",
      },
      { status: 502 },
    );
  }
}
