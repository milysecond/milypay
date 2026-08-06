import { NextResponse } from "next/server";
import { getNemNotices } from "@/lib/energy";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** GET /au-energy/notices — recent AEMO market notices */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : undefined;

  return withX402(
    req,
    { price: "0.002", description: "AEMO NEM market notices" },
    async () => {
      try {
        const data = await getNemNotices({ limit });
        return NextResponse.json(data, {
          headers: { "Cache-Control": "public, max-age=60" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "NEM notices failed";
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    },
  );
}
