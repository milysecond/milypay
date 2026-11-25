import { NextResponse } from "next/server";
import { PRICES, isSafeNni, normalizeNni, okJson, organisationDetails, relayFail } from "@/lib/acceleon";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ nni: string }> }) {
  const nni = normalizeNni(decodeURIComponent((await params).nni));
  if (!isSafeNni(nni)) {
    return NextResponse.json({ error: "Invalid NNI (alphanumeric, up to 32 chars)" }, { status: 400 });
  }
  return withX402(req, { price: PRICES.details, description: `ASIC business details (UAT) ${nni}` }, async () => {
    try {
      const raw = (await organisationDetails("business", nni)) as Record<string, unknown> | null;
      return okJson({
        kind: "business",
        nni,
        canPurchaseCurrent: raw?.CanPurchaseCurrentExtract ?? null,
        canPurchaseHistorical: raw?.CanPurchaseCurrentAndHistoricalExtract ?? null,
        purchase: { method: "POST", path: "/au-asic-extract/purchase", body: { nni, kind: "business", type: "current" } },
        details: raw?.Details ?? null,
        formerNames: raw?.FormerNames ?? [],
        raw,
      });
    } catch (e) {
      return relayFail(e);
    }
  });
}
