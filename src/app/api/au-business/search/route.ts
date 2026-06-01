import { NextResponse } from "next/server";
import { searchByName } from "@/lib/abr";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const max = Number(searchParams.get("maxResults") || "10");
  return withX402(
    req,
    { price: "0.004", description: `ABN name search: ${name}` },
    async () => {
      try {
        const result = await searchByName(name, Number.isFinite(max) ? max : 10);
        if ("error" in result) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, {
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "search failed";
        const status = msg.includes("ABR_GUID") ? 503 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
