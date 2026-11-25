import { NextResponse } from "next/server";
import { ACCELEON_ENV, PRICES, UAT_NOTICE } from "@/lib/acceleon";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      brand: "Milypay",
      service: "au-asic-extract",
      title: "ASIC company & business extracts (Acceleon)",
      environment: ACCELEON_ENV,
      testMode: true,
      notice: UAT_NOTICE,
      docs: "https://milypay.xyz/docs#asic-extract",
      flow: [
        "GET /au-asic-extract/search?name= -> pick an NNI (ACN for companies)",
        "GET /au-asic-extract/company/{nni} -> check canPurchaseCurrent / canPurchaseHistorical",
        "POST /au-asic-extract/purchase {nni, kind, type} (x402) -> extractId + token",
        "GET /au-asic-extract/status/{extractId}?token= until Complete",
        "GET /au-asic-extract/extract/{extractId}?token=&pdf=1 (or format=pdf)",
      ],
      endpoints: [
        { method: "GET", path: "/au-asic-extract/search?name={name}", price: PRICES.search },
        { method: "GET", path: "/au-asic-extract/company/{nni}", price: PRICES.details },
        { method: "GET", path: "/au-asic-extract/business/{nni}", price: PRICES.details },
        { method: "POST", path: "/au-asic-extract/purchase", price: `${PRICES.purchaseCurrent} current / ${PRICES.purchaseHistorical} current+historical`, alwaysPaid: true },
        { method: "GET", path: "/au-asic-extract/status/{extractId}?token=", price: "0 (buyer token)" },
        { method: "GET", path: "/au-asic-extract/extract/{extractId}?token=&pdf=1", price: "0 (buyer token)" },
      ],
      pricingNote:
        "Test prices only. Production pricing will exceed Acceleon's A$12 (current) / A$23 (current + historical) per-extract cost.",
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
