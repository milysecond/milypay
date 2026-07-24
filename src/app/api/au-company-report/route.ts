import { NextResponse } from "next/server";
import {
  BusinessApiError,
  bapiEnvFromRequest,
  orderAndFetchExtract,
} from "@/lib/businessapi";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: ASIC company extract ordered via Business API (DSP)";

// Live retail price on api.milypay.xyz. Website demos use sandbox (free, throttled).
const PRICE = "12.00";

/**
 * Official ASIC company extract.
 *
 * Host routing:
 *   milypay.xyz / www / demo  -> Business API test keys (sandbox), free + throttled
 *   api.milypay.xyz           -> live keys, always paid via x402
 *
 * Prefer free gov sources for basic company identity (/au-company, /au-business).
 * Query: ?acn=000014675&type=current|historical
 */
async function handle(req: Request, acn: string, extractType?: string) {
  const environment = bapiEnvFromRequest(req);
  const isDemo = environment === "test";

  return withX402(
    req,
    {
      price: PRICE,
      description: `ASIC company extract for ACN ${acn}${isDemo ? " (sandbox demo)" : ""}`,
      // Only charge on the API host / live path. Website demos use free sandbox.
      alwaysPaid: !isDemo,
    },
    async () => {
      try {
        const digits = acn.replace(/\D/g, "");
        if (digits.length === 0 || digits.length > 9) {
          return NextResponse.json({ error: "ACN must be up to 9 digits" }, { status: 400 });
        }

        const extract = await orderAndFetchExtract(digits, extractType || "current", {
          environment,
        });

        return NextResponse.json(
          {
            ...extract,
            attribution: isDemo
              ? `${ATTRIBUTION} [sandbox demo - not a live ASIC extract]`
              : ATTRIBUTION,
          },
          {
            headers: {
              "Cache-Control": "private, no-store",
              "x-data-source": isDemo ? `${ATTRIBUTION} (sandbox)` : ATTRIBUTION,
              "x-bapi-environment": environment,
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
                hint: "Live extracts need a card on businessapi.com.au. Website demos use sandbox automatically.",
              },
              { status: 503 },
            );
          }
          if (e.status === 400 || e.status === 422) {
            return NextResponse.json(
              { error: e.message, code: e.code, details: e.body },
              { status: 400 },
            );
          }
          if (e.status === 404) {
            return NextResponse.json({ error: e.message, code: e.code }, { status: 404 });
          }
          return NextResponse.json({ error: e.message, code: e.code }, { status: 502 });
        }
        const msg = e instanceof Error ? e.message : "company extract failed";
        const status =
          msg.includes("BAPI_SECRET_KEY") || msg.includes("BAPI_TEST_SECRET_KEY") ? 503 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const acn = searchParams.get("acn") || "";
  const extractType = searchParams.get("type") || undefined;
  if (!acn.trim()) {
    return NextResponse.json({ error: "acn query param is required" }, { status: 400 });
  }
  return handle(req, acn, extractType);
}

export async function POST(req: Request) {
  let body: { acn?: string; extractType?: string; type?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  }
  const acn = body.acn || "";
  if (!acn.trim()) {
    return NextResponse.json({ error: "acn is required" }, { status: 400 });
  }
  return handle(req, acn, body.extractType || body.type);
}
