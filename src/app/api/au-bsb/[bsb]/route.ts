import { NextResponse } from "next/server";
import { lookupBsb } from "@/lib/bsb";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: AusPayNet BSB Directory (auspaynet.com.au/BSBLinks)";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ bsb: string }> },
) {
  const { bsb } = await params;
  return withX402(req, { price: "0.002", description: `BSB lookup ${bsb}` }, async () => {
    try {
      const result = await lookupBsb(bsb);
      if ("error" in result) {
        return NextResponse.json(result, { status: result.error.includes("not found") ? 404 : 400 });
      }
      return NextResponse.json(
        { ...result, attribution: ATTRIBUTION },
        { headers: { "Cache-Control": "public, max-age=86400", "x-data-source": ATTRIBUTION } },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "BSB lookup failed";
      const status = msg.includes("TURSO") ? 503 : 502;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
