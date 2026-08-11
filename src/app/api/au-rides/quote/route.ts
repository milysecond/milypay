import { NextResponse } from "next/server";
import { errorToResponse, parseQuoteQuery, quoteRide } from "@/lib/rides";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * GET /au-rides/quote?start_lat=&start_lng=&end_lat=&end_lng=&seat_count=
 * Uber price estimates only — no booking.
 */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.01", description: "Uber ride price estimate quote only" },
    async () => {
      try {
        const q = parseQuoteQuery(new URL(req.url));
        const data = await quoteRide(q);
        return NextResponse.json(data, {
          headers: { "Cache-Control": "private, max-age=30" },
        });
      } catch (e) {
        const { status, body } = errorToResponse(e);
        return NextResponse.json(body, { status });
      }
    },
  );
}
