import { NextResponse } from "next/server";
import { getCpi } from "@/lib/abs";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /au-abs/cpi?startPeriod= — headline All groups CPI (Australia, quarterly) */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const startPeriod = url.searchParams.get("startPeriod") || url.searchParams.get("start") || undefined;
  const endPeriod = url.searchParams.get("endPeriod") || url.searchParams.get("end") || undefined;
  const key = url.searchParams.get("key") || undefined;

  return withX402(
    req,
    { price: "0.003", description: "ABS CPI headline series" },
    async () => {
      try {
        const result = await getCpi({ startPeriod, endPeriod, key });
        return NextResponse.json(result, {
          headers: { "Cache-Control": "public, max-age=1800" },
        });
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "ABS CPI failed" },
          { status: 502 },
        );
      }
    },
  );
}
