import { NextResponse } from "next/server";
import { lookupPhone } from "@/lib/phone";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * GET /au-phone/{phone}
 * phone: E.164 (+614…) or AU mobile 04xxxxxxxx (URL-encoded + as %2B)
 *
 * Line intel: valid, country, type, carrier. Not personal identity.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ phone: string }> },
) {
  const { phone: raw } = await params;
  // path segment may arrive decoded or with spaces
  const phone = decodeURIComponent(raw);

  return withX402(
    req,
    {
      price: "0.05",
      description: `Phone line lookup ${phone.slice(0, 6)}…`,
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
