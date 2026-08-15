import { NextResponse } from "next/server";
import { domaQuote, errorToResponse } from "@/lib/doma";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /domains/doma/quote?name=&years= */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.01", description: "Doma domain registration quote" },
    async () => {
      try {
        const url = new URL(req.url);
        const name = url.searchParams.get("name") || "";
        const years = Number(url.searchParams.get("years") || "1");
        if (!name) {
          return NextResponse.json(
            { error: "name required", code: "bad_request", brand: "Milypay" },
            { status: 400 },
          );
        }
        return NextResponse.json(await domaQuote(name, years), {
          headers: { "Cache-Control": "private, max-age=30" },
        });
      } catch (e) {
        const { status, body } = errorToResponse(e);
        return NextResponse.json(body, { status });
      }
    },
  );
}
