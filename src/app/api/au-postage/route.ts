import { NextResponse } from "next/server";
import { domesticParcelPostage, internationalParcelPostage } from "@/lib/auspost";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: Australia Post Postage Assessment Calculator";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const weight = searchParams.get("weight") || "1";
  const length = searchParams.get("length") || undefined;
  const width = searchParams.get("width") || undefined;
  const height = searchParams.get("height") || undefined;

  return withX402(req, { price: "0.002", description: "Postage calculation" }, async () => {
    try {
      const result = country
        ? await internationalParcelPostage({ country, weight })
        : await domesticParcelPostage({ from, to, weight, length, width, height });
      if ("error" in result) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(
        { ...result, attribution: ATTRIBUTION },
        { headers: { "Cache-Control": "public, max-age=86400", "x-data-source": ATTRIBUTION } },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "postage lookup failed";
      const status = msg.includes("AUSPOST_PAC_KEY") ? 503 : 502;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
