import { NextResponse } from "next/server";
import { BusinessApiError, lookupAcn } from "@/lib/businessapi";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: Live ASIC/ACN validation via Business API (DSP)";

/**
 * Live ACN validation & lookup (Business API paid collection).
 * Requires a saved payment method on the Business API dashboard.
 * Always paid: upstream is metered, never free on milypay.xyz host.
 */
export async function GET(req: Request, { params }: { params: Promise<{ acn: string }> }) {
  const { acn } = await params;

  return withX402(
    req,
    {
      price: "0.05",
      description: `Live ACN lookup ${acn}`,
      alwaysPaid: true,
    },
    async () => {
      try {
        const data = await lookupAcn(acn);
        return NextResponse.json(
          { acn: acn.replace(/\D/g, "").padStart(9, "0"), data, attribution: ATTRIBUTION },
          {
            headers: {
              "Cache-Control": "private, max-age=300",
              "x-data-source": ATTRIBUTION,
            },
          },
        );
      } catch (e) {
        if (e instanceof BusinessApiError) {
          if (e.needsPaymentMethod) {
            return NextResponse.json(
              {
                error: "Upstream Business API account requires a saved payment method",
                code: "upstream_payment_method_required",
              },
              { status: 503 },
            );
          }
          if (e.status === 400 || e.status === 404) {
            return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
          }
          return NextResponse.json({ error: e.message, code: e.code }, { status: 502 });
        }
        const msg = e instanceof Error ? e.message : "live ACN lookup failed";
        const status = msg.includes("BAPI_SECRET_KEY") ? 503 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
