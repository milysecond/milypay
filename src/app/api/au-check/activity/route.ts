import { NextResponse } from "next/server";
import { activitySearch } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || url.searchParams.get("search") || "";
  if (q.length < 3) {
    return NextResponse.json({ error: "Missing q (min 3 chars)", example: "/au-check/activity?q=farming" }, { status: 400 });
  }
  return withX402(req, { price: "0.005", description: `ANZSIC ${q.slice(0, 24)}` }, async () => {
    try {
      const data = await activitySearch(q, url.searchParams.get("limit") || undefined);
      return NextResponse.json({ brand: "Milypay", source: "Checkify", q, data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
