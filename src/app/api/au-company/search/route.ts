import { NextResponse } from "next/server";
import { searchByName } from "@/lib/asic";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: ASIC Company Register (data.gov.au open data)";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const limit = Number(searchParams.get("limit") || "8");
  return withX402(req, { price: "0.004", description: `Company name search: ${name}` }, async () => {
    try {
      const result = await searchByName(name, Number.isFinite(limit) ? limit : 8);
      if ("error" in result) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(
        { ...result, attribution: ATTRIBUTION },
        { headers: { "Cache-Control": "public, max-age=3600", "x-data-source": ATTRIBUTION } },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "search failed";
      const status = msg.includes("TURSO") ? 503 : 502;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
