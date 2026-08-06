import { NextResponse } from "next/server";
import { getNemSummary } from "@/lib/energy";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /au-energy/nem — all NEM regions live price + demand */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.002", description: "AEMO NEM live summary all regions" },
    async () => {
      try {
        const data = await getNemSummary();
        return NextResponse.json(data, {
          headers: { "Cache-Control": "public, max-age=30" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "NEM summary failed";
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    },
  );
}
