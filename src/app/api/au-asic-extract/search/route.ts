import { NextResponse } from "next/server";
import { PRICES, okJson, relayFail, searchOrganisations } from "@/lib/acceleon";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = (url.searchParams.get("name") || url.searchParams.get("q") || "").trim();
  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "name query param required (2-120 chars). Search is by name only.", example: "/au-asic-extract/search?name=milysec" },
      { status: 400 },
    );
  }
  return withX402(req, { price: PRICES.search, description: `ASIC org search (UAT) ${name.slice(0, 24)}` }, async () => {
    try {
      const raw = (await searchOrganisations(name)) as Record<string, unknown> | null;
      const company = Array.isArray(raw?.CompanyResults) ? raw!.CompanyResults : [];
      const business = Array.isArray(raw?.BusinessResults) ? raw!.BusinessResults : [];
      const other = Object.fromEntries(
        Object.entries(raw || {}).filter(([k]) => k !== "CompanyResults" && k !== "BusinessResults"),
      );
      return okJson({ query: name, companyResults: company, businessResults: business, ...other });
    } catch (e) {
      return relayFail(e);
    }
  });
}
