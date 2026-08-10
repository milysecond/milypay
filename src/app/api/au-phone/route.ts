import { NextResponse } from "next/server";
import { lookupPhone } from "@/lib/phone";
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
        const msg = e instanceof Error ? e.message : "Phone lookup failed";
        const status =
          (e as { status?: number }).status ||
          (msg.includes("not configured")
            ? 503
            : msg.includes("Invalid") || msg.includes("must be")
              ? 400
              : 502);
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
