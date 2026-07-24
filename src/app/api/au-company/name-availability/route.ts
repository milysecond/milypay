import { NextResponse } from "next/server";
import { BusinessApiError, companyNameAvailability } from "@/lib/businessapi";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: ASIC company name availability via Business API (DSP)";

/**
 * Live ASIC company name availability check.
 * Upstream: GET /api/v2/helpers/company-name-availability (no dashboard card required).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";

  return withX402(
    req,
    { price: "0.001", description: `Company name availability: ${name}` },
    async () => {
      try {
        if (!name.trim()) {
          return NextResponse.json({ error: "name query param is required" }, { status: 400 });
        }
        const result = await companyNameAvailability(name);
        return NextResponse.json(
          {
            name: result.name,
            available: result.available,
            availability: result.availability,
            shortDescription: result.shortDescription,
            objections: result.objections,
            existingBusinessName: result.existingbn ?? null,
            attribution: ATTRIBUTION,
          },
          {
            headers: {
              "Cache-Control": "public, max-age=300",
              "x-data-source": ATTRIBUTION,
            },
          },
        );
      } catch (e) {
        if (e instanceof BusinessApiError) {
          const status = e.status === 400 ? 400 : e.status === 401 || e.status === 403 ? 502 : 502;
          return NextResponse.json(
            { error: e.message, code: e.code },
            { status: status === 400 ? 400 : 502 },
          );
        }
        const msg = e instanceof Error ? e.message : "name availability failed";
        const status = msg.includes("BAPI_SECRET_KEY") ? 503 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
