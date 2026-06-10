import { NextResponse } from "next/server";
import { withX402 } from "@/lib/x402";
import { payAndFetch } from "@/lib/x402pay";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Market data by Birdeye (birdeye/data on pay.sh), resold by MilyPay";
const BIRDEYE = "https://public-api.birdeye.so/x402";

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const { search } = new URL(req.url);
  const upstream = `${BIRDEYE}/${path.join("/")}${search}`;

  return withX402(
    req,
    { price: "0.2", description: `Market data: ${path.join("/")}`, alwaysPaid: true },
    async () => {
      try {
        const res = await payAndFetch(upstream);
        const body = await res.text();
        if (!res.ok) {
          console.error("markets upstream", res.status, body.slice(0, 300));
          return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
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
