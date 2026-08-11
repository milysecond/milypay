import { NextResponse } from "next/server";
import { errorToResponse, etaRide, parseEtaQuery } from "@/lib/rides";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * GET /au-rides/eta?start_lat=&start_lng=&product_id=
 * Uber pickup ETAs only — no booking.
 */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.01", description: "Uber pickup ETA estimate quote only" },
    async () => {
      try {
        const q = parseEtaQuery(new URL(req.url));
        const data = await etaRide(q);
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
