import { NextResponse } from "next/server";
import { lookupByAcn } from "@/lib/asic";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: ASIC Company Register (data.gov.au open data)";

export async function GET(req: Request, { params }: { params: Promise<{ acn: string }> }) {
  const { acn } = await params;
  return withX402(req, { price: "0.002", description: `Company lookup for ACN ${acn}` }, async () => {
    try {
      const result = await lookupByAcn(acn);
      if ("error" in result) return NextResponse.json(result, { status: 404 });
      return NextResponse.json(
        { ...result, attribution: ATTRIBUTION },
        { headers: { "Cache-Control": "public, max-age=86400", "x-data-source": ATTRIBUTION } },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "lookup failed";
      const status = msg.includes("TURSO") ? 503 : 502;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
