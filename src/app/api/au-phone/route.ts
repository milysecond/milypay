import { NextResponse } from "next/server";
import { lookupPhone, phoneErrorInfo } from "@/lib/phone";
import { apiError, type ApiErrorCode } from "@/lib/errors";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * GET /au-phone?number=+614…
 * Query form for clients that dislike path-encoded +.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone =
    url.searchParams.get("number") ||
    url.searchParams.get("phone") ||
    url.searchParams.get("q") ||
    "";

  if (!phone) {
    return NextResponse.json(
      {
        error: "Missing number. Use ?number=+61412345678 or /au-phone/{e164}",
        example: "/au-phone?number=%2B61412345678",
        note: "Line intelligence only (valid/type/carrier) — not personal identity.",
      },
      { status: 400 },
    );
  }

  return withX402(
    req,
    {
      price: "0.05",
      description: `Phone line lookup ${phone.slice(0, 8)}`,
    },
    async () => {
      try {
        const data = await lookupPhone(phone);
        return NextResponse.json(data, {
          headers: {
            "Cache-Control": "private, max-age=3600",
            "x-data-source": "twilio-lookup-v2",
          },
        });
      } catch (e) {
        const info = phoneErrorInfo(e);
        return apiError(info.status, info.code as ApiErrorCode, info.error);
      }
    },
  );
}
