import { NextResponse } from "next/server";
import { withX402 } from "@/lib/x402";
import { payAndFetch } from "@/lib/x402pay";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Market data by Birdeye (birdeye/data on pay.sh), resold by MilyPay";
const BIRDEYE = "https://public-api.birdeye.so/x402";

// Proxy MilyPay -> Birdeye. Customer pays MilyPay in AUDD (x402 on the api host); the
// Worker pays Birdeye in USDC server-side and returns the data.
// e.g. GET /api/markets/defi/price?address=...&chain=solana
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const { search } = new URL(req.url);
  const upstream = `${BIRDEYE}/${path.join("/")}${search}`;

  return withX402(
    req,
    { price: "0.05", description: `Market data: ${path.join("/")}` },
    async () => {
      try {
        const res = await payAndFetch(upstream);
        const body = await res.text();
        if (!res.ok) {
          return NextResponse.json(
            { error: `Upstream ${res.status}`, detail: body.slice(0, 300) },
            { status: 502 },
          );
        }
        return new NextResponse(body, {
          status: 200,
          headers: {
            "content-type": res.headers.get("content-type") || "application/json",
            "Cache-Control": "public, max-age=15",
            "x-data-source": ATTRIBUTION,
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "proxy failed";
        const status = msg.includes("SOLANA_PAYER_SECRET") ? 503 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
