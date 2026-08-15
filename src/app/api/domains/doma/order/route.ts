import { NextResponse } from "next/server";
import { errorToResponse, getOrder } from "@/lib/doma";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /domains/doma/order?id= */
export async function GET(req: Request) {
  return withX402(
    req,
    { price: "0.005", description: "Doma order status poll" },
    async () => {
      try {
        const id = new URL(req.url).searchParams.get("id") || "";
        if (!id) {
          return NextResponse.json({ error: "id required", code: "bad_request" }, { status: 400 });
        }
        return NextResponse.json(await getOrder(id));
      } catch (e) {
        const { status, body } = errorToResponse(e);
        return NextResponse.json(body, { status });
      }
    },
  );
}
