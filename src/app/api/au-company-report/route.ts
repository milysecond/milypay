import { NextResponse } from "next/server";
import { BusinessApiError, orderCompanyExtract } from "@/lib/businessapi";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: ASIC company extract ordered via Business API (DSP)";

// ASIC current extracts typically cost ~AUD 9–20 at the counter; retail via x402
// covers upstream + margin. Adjust after first live BAPI invoice.
const PRICE = "12.00";

/**
 * Official ASIC company extract (directors, office, share capital, etc.).
 * Upstream: POST /api/v2/asic/extracts via Business API DSP.
 *
 * Prefer free gov sources for basic company identity:
 *   GET /au-company/acn/{acn}   (ASIC open data)
 *   GET /au-business/abn/{abn}  (ABR)
 * Use this endpoint only for extract fields those free APIs do not publish.
 *
 * Always paid: never free on the website host (upstream costs real money).
 * Returns 503 if the Business API account still needs a dashboard card.
 *
 * Query: ?acn=000014675  (or POST JSON { "acn": "..." })
 */
async function handle(req: Request, acn: string, extractType?: string) {
  return withX402(
    req,
    {
      price: PRICE,
      description: `ASIC company extract for ACN ${acn}`,
      alwaysPaid: true,
    },
    async () => {
      try {
        const digits = acn.replace(/\D/g, "");
        if (digits.length === 0 || digits.length > 9) {
          return NextResponse.json({ error: "ACN must be up to 9 digits" }, { status: 400 });
        }

        const body: { acn: string; extractType?: string } = {
          acn: digits.padStart(9, "0"),
        };
        if (extractType) body.extractType = extractType;

        const data = await orderCompanyExtract(body);
        return NextResponse.json(
          {
            acn: body.acn,
            extract: data,
            attribution: ATTRIBUTION,
          },
          {
            headers: {
              "Cache-Control": "private, no-store",
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
                hint: "Add a card at https://businessapi.com.au dashboard, then retry",
              },
              { status: 503 },
            );
          }
          // Validation / schema issues from BAPI (body shape may need tuning after first live order)
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
        const status = msg.includes("BAPI_SECRET_KEY") ? 503 : 502;
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
