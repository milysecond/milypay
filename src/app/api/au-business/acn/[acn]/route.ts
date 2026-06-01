import { NextResponse } from "next/server";
import { lookupAcn } from "@/lib/abr";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ acn: string }> },
) {
  const { acn } = await params;
  return withX402(
    req,
    { price: "0.002", description: `ACN lookup for ${acn}` },
    async () => {
      try {
        const result = await lookupAcn(acn);
        if ("error" in result) {
          return NextResponse.json(result, { status: 404 });
        }
        return NextResponse.json(result, {
          headers: { "Cache-Control": "public, max-age=86400" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "lookup failed";
        const status = msg.includes("ABR_GUID") ? 503 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
