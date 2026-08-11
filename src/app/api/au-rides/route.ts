import { NextResponse } from "next/server";
import { listRideProducts } from "@/lib/rides";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /au-rides — catalogue (Uber quote-only) */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.001", description: "AU rides products catalogue" },
    async () => {
      return NextResponse.json(listRideProducts(), {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    },
  );
}
