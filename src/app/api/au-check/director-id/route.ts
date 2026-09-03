import { NextResponse } from "next/server";
import { directorIdCheck } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.searchParams.get("director_id") || "";
  if (!id) {
    return NextResponse.json({ error: "Missing id", example: "/au-check/director-id?id=036123456789010", notice: "Checksum only — not a live ABRS lookup." }, { status: 400 });
  }
  return withX402(req, { price: "0.01", description: "Director ID checksum" }, async () => {
    try {
      const data = await directorIdCheck(id);
      return NextResponse.json({ brand: "Milypay", source: "Checkify", notice: "Structural validity only.", data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
