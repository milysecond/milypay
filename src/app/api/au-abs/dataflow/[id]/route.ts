import { NextResponse } from "next/server";
import { getDataflow } from "@/lib/abs";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /au-abs/dataflow/{id} — ABS dataflow structure/metadata */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withX402(
    req,
    { price: "0.002", description: `ABS dataflow metadata: ${id}` },
    async () => {
      try {
        const result = await getDataflow(id);
        return NextResponse.json(result, {
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "ABS dataflow failed";
        const status = msg.includes("Invalid") ? 400 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
