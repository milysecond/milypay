import { NextResponse } from "next/server";
import { domaQuote, domaRegister, errorToResponse, type RegistrantContact } from "@/lib/doma";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * POST /domains/doma/register
 * Body: {
 *   name, years?,
 *   buyer?,                    // 0x or CAIP-10 — receives name token
 *   emailVerificationProof?,   // unless DOMA_VERIFIED_UPLOAD
 *   registrantHandle?,         // skip contact upload if already have handle
 *   contact?: { name, email, phone, street, city, state, postalCode, countryCode },
 *   poll?: boolean             // default true
 * }
 */
export async function POST(req: Request) {
  let body: {
    name?: string;
    years?: number;
    buyer?: string;
    emailVerificationProof?: string;
    registrantHandle?: string;
    contact?: Partial<RegistrantContact>;
    poll?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON body required", code: "bad_request" }, { status: 400 });
  }

  const name = String(body.name || "");
  if (!name) {
    return NextResponse.json({ error: "name required", code: "bad_request" }, { status: 400 });
  }

  let chargeUsd = "0";
  let years = Number(body.years || 1);
  try {
    const quote = await domaQuote(name, years);
    if (!quote.canRegister) {
      return NextResponse.json(
        {
          error: quote.reason || "cannot register",
          code: quote.reason || "cannot_register",
          brand: "Milypay",
          provider: "doma",
          quote,
        },
        { status: 400 },
      );
    }
    chargeUsd = quote.chargeUsd;
    years = quote.years;
  } catch (e) {
    const { status, body: b } = errorToResponse(e);
    return NextResponse.json(b, { status });
  }

  const gateReq = new Request(req.url, { method: "POST", headers: req.headers });
  return withX402(
    gateReq,
    {
      price: chargeUsd,
      description: `Doma register ${name} ${years}y`,
      alwaysPaid: true,
    },
    async () => {
      try {
        const result = await domaRegister({
          name,
          years,
          buyer: body.buyer,
          contact: body.contact,
          emailVerificationProof: body.emailVerificationProof,
          registrantHandle: body.registrantHandle,
          poll: body.poll,
        });
        return NextResponse.json(result, { status: result.success ? 200 : 502 });
      } catch (e) {
        const { status, body: b } = errorToResponse(e);
        return NextResponse.json(
          {
            ...b,
            warning:
              "x402 may have settled. If orderId present, poll GET /domains/doma/order?id=… before retrying pay.",
          },
          { status },
        );
      }
    },
  );
}
