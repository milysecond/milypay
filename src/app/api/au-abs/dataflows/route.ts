import { NextResponse } from "next/server";
import { listDataflows } from "@/lib/abs";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /au-abs/dataflows?q=&limit= — search/list ABS SDMX dataflows */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || url.searchParams.get("query") || undefined;
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : undefined;

  return withX402(
    req,
    {
      price: "0.002",
      description: q ? `ABS dataflow search: ${q}` : "ABS dataflow catalogue",
    },
    async () => {
      try {
        const result = await listDataflows({ q, limit });
        return NextResponse.json(result, {
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "ABS dataflows failed" },
          { status: 502 },
        );
      }
    },
  );
}
