import { NextResponse } from "next/server";
import { checkifyCatalogue } from "@/lib/checkify";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.001", description: "Checkify AU extras catalogue" },
    async () =>
      NextResponse.json(checkifyCatalogue(), {
        headers: { "x-data-source": "Milypay / Checkify" },
      }),
  );
}
