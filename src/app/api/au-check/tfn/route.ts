import { NextResponse } from "next/server";
import { tfnCheck } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tfn = url.searchParams.get("tfn") || url.searchParams.get("q") || "";
  if (!tfn) {
    return NextResponse.json({ error: "Missing tfn", example: "/au-check/tfn?tfn=123456782", notice: "Checksum only — not a live ATO lookup." }, { status: 400 });
  }
  return withX402(req, { price: "0.01", description: "TFN checksum" }, async () => {
    try {
      const data = await tfnCheck(tfn);
      return NextResponse.json({ brand: "Milypay", source: "Checkify", notice: "Structural validity only. Not a live ATO lookup.", data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
