import { NextResponse } from "next/server";
import { listDomaProducts } from "@/lib/doma";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /domains/doma */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.001", description: "Doma domains catalogue" },
    async () =>
      NextResponse.json(listDomaProducts(), {
        headers: { "Cache-Control": "public, max-age=120" },
      }),
  );
}
