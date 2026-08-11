import { NextResponse } from "next/server";
import { errorToResponse, parseProductsQuery, productsAt } from "@/lib/rides";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * GET /au-rides/products?lat=&lng=
 * Uber products at a point — no booking.
 */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.005", description: "Uber products at location quote only" },
    async () => {
      try {
        const q = parseProductsQuery(new URL(req.url));
        const data = await productsAt(q);
        return NextResponse.json(data, {
          headers: { "Cache-Control": "private, max-age=60" },
        });
      } catch (e) {
        const { status, body } = errorToResponse(e);
        return NextResponse.json(body, { status });
      }
    },
  );
}
