import { NextResponse } from "next/server";
import { errorToResponse, quoteDomain } from "@/lib/domains";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /domains/quote?name=example.com&years=1 */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.01", description: "Domain registration quote" },
    async () => {
      try {
        const url = new URL(req.url);
        const name = url.searchParams.get("name") || "";
        const years = Number(url.searchParams.get("years") || "1");
        if (!name) {
          return NextResponse.json(
            { error: "name query required", code: "bad_request", brand: "Milypay" },
            { status: 400 },
          );
        }
        const data = await quoteDomain(name, years);
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
