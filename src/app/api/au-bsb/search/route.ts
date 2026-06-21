import { NextResponse } from "next/server";
import { searchBsb } from "@/lib/bsb";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: AusPayNet BSB Directory (auspaynet.com.au/BSBLinks)";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || "10");
  return withX402(req, { price: "0.004", description: `BSB search: ${q}` }, async () => {
    try {
      const result = await searchBsb(q, Number.isFinite(limit) ? limit : 10);
      if ("error" in result) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(
        { ...result, attribution: ATTRIBUTION },
        { headers: { "Cache-Control": "public, max-age=3600", "x-data-source": ATTRIBUTION } },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "BSB search failed";
      const status = msg.includes("TURSO") ? 503 : 502;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
