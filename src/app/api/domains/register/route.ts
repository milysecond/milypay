import { NextResponse } from "next/server";
import { errorToResponse, quoteDomain, registerDomain } from "@/lib/domains";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * POST /domains/register
 * Body JSON: { "name": "example.com", "years": 1 }
 *
 * Price is dynamic from quote (registrar + markup). Always paid (even on demo host)
 * so agents cannot burn Dynadot balance for free.
 */
export async function POST(req: Request) {
  let name = "";
  let years = 1;
  try {
    const body = (await req.json()) as { name?: string; years?: number };
    name = String(body.name || "");
    years = Number(body.years || 1);
  } catch {
    return NextResponse.json(
      { error: "JSON body required: {name, years?}", code: "bad_request", brand: "Milypay" },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json(
      { error: "name required", code: "bad_request", brand: "Milypay" },
      { status: 400 },
    );
  }

  let chargeUsd = "0";
  let fqName = name;
  try {
    const quote = await quoteDomain(name, years);
    if (!quote.canRegister) {
      return NextResponse.json(
        {
          error: quote.reason || "cannot register",
          code: quote.reason || "cannot_register",
          brand: "Milypay",
          quote,
        },
        { status: 400 },
      );
    }
    chargeUsd = quote.chargeUsd;
    fqName = quote.name;
    years = quote.years;
  } catch (e) {
    const { status, body } = errorToResponse(e);
    return NextResponse.json(body, { status });
  }

  // Clone request for withX402 — body already consumed; gate only needs headers/url.
  const gateReq = new Request(req.url, { method: "POST", headers: req.headers });

  return withX402(
    gateReq,
    {
      price: chargeUsd,
      description: `Register domain ${fqName} ${years}y`,
      alwaysPaid: true,
    },
    async () => {
      try {
        const result = await registerDomain(fqName, years);
        if (!result.success) {
          // Payment already settled — surface registrar failure clearly for support.
          return NextResponse.json(
            {
              ...result,
              warning:
                "Payment may have settled but registrar did not confirm success. Contact support with $receipt.",
            },
            { status: 502 },
          );
        }
        return NextResponse.json(result);
      } catch (e) {
        const { status, body } = errorToResponse(e);
        return NextResponse.json(
          {
            ...body,
            warning:
              "Payment may have settled but registration failed. Contact support with $receipt.",
          },
          { status },
        );
      }
    },
  );
}
