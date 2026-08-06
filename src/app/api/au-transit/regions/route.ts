import { NextResponse } from "next/server";
import { listRegions } from "@/lib/transit";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /au-transit/regions — live + planned Australian transit regions */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.001", description: "AU transit regions catalogue" },
    async () => {
      return NextResponse.json(listRegions(), {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    },
  );
}
