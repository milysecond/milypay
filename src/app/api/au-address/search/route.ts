import { NextResponse } from "next/server";
import { searchAddresses } from "@/lib/gnaf";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Incorporates G-NAF (c) Geoscape Australia, open licence";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || "8");
  return withX402(req, { price: "0.004", description: `Address search: ${q}` }, async () => {
    if (q.trim().length < 2) {
      return NextResponse.json({ error: "q must be at least 2 characters" }, { status: 400 });
    }
    try {
      const results = await searchAddresses(q, Number.isFinite(limit) ? limit : 8);
      return NextResponse.json(
        { query: q, count: results.length, results, attribution: ATTRIBUTION },
        { headers: { "Cache-Control": "public, max-age=3600", "x-data-source": ATTRIBUTION } },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "search failed";
      const status = msg.includes("TURSO") ? 503 : 502;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
