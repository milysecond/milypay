import { NextResponse } from "next/server";
import { suburbSearch } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || url.searchParams.get("query") || "";
  if (q.length < 2) {
    return NextResponse.json({ error: "Missing q (min 2 chars)", example: "/au-check/suburb?q=parra" }, { status: 400 });
  }
  return withX402(req, { price: "0.005", description: `Suburb search ${q.slice(0, 24)}` }, async () => {
    try {
      const data = await suburbSearch(q, url.searchParams.get("country") || "au");
      return NextResponse.json({ brand: "Milypay", source: "Checkify", q, data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
