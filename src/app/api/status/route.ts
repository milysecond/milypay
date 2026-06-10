import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RPC = process.env.SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const AUDD = "AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw";
// Public addresses (payer float + AUDD receiving wallet).
const PAYER = "CJnsfwWEif4G1mWsJWkjoWSuRpoPoCQHWsQdgzEFDufC";

async function tokenBalance(owner: string, mint: string): Promise<number> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [owner, { mint }, { encoding: "jsonParsed" }],
    }),
  });
  const d = (await res.json()) as {
    result?: { value?: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } } }[] };
  };
  return (d.result?.value || []).reduce(
    (s, a) => s + (a.account.data.parsed.info.tokenAmount.uiAmount || 0),
    0,
  );
}

export async function GET() {
  const payTo = process.env.PAY_TO_WALLET || "";
  try {
    const [floatUsdc, receivedAudd] = await Promise.all([
      tokenBalance(PAYER, USDC),
      payTo ? tokenBalance(payTo, AUDD) : Promise.resolve(0),
    ]);
    return NextResponse.json(
      {
        services: ["au-business", "au-company", "au-address", "au-super", "au-weather", "markets"],
        x402: process.env.X402_ENABLED === "true",
        float: { usdc: floatUsdc },
        receiving: { audd: receivedAudd },
      },
      { headers: { "Cache-Control": "public, max-age=30" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "status unavailable" },
      { status: 502 },
    );
  }
}
