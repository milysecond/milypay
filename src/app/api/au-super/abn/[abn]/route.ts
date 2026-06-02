import { NextResponse } from "next/server";
import { lookupSuperByAbn } from "@/lib/sfl";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ abn: string }> },
) {
  const { abn } = await params;
  return withX402(
    req,
    { price: "0.002", description: `Super fund lookup for ABN ${abn}` },
    async () => {
      try {
        const result = await lookupSuperByAbn(abn);
        if ("error" in result) {
          return NextResponse.json(result, { status: 404 });
        }
        return NextResponse.json(result, {
          headers: { "Cache-Control": "public, max-age=86400" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "lookup failed";
        const status = msg.includes("SFL_GUID") ? 503 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
