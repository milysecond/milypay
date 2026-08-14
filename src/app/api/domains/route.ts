import { NextResponse } from "next/server";
import { listDomainProducts } from "@/lib/domains";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /domains — catalogue */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.001", description: "Domain products catalogue" },
    async () =>
      NextResponse.json(listDomainProducts(), {
        headers: { "Cache-Control": "public, max-age=300" },
      }),
  );
}
