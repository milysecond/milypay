import { NextResponse } from "next/server";
import { checkDomain, errorToResponse } from "@/lib/domains";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /domains/check?name=example.com */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.01", description: "Domain availability check" },
    async () => {
      try {
        const name = new URL(req.url).searchParams.get("name") || "";
        if (!name) {
          return NextResponse.json(
            { error: "name query required", code: "bad_request", brand: "Milypay" },
            { status: 400 },
          );
        }
        const data = await checkDomain(name);
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
