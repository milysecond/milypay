import { NextResponse } from "next/server";
import { listEnergyProducts } from "@/lib/energy";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /au-energy — catalogue of energy products */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.001", description: "AU energy products catalogue" },
    async () => {
      return NextResponse.json(listEnergyProducts(), {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    },
  );
}
