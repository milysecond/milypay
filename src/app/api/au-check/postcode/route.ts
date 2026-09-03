import { NextResponse } from "next/server";
import { postcodeLookup } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const postcode = url.searchParams.get("postcode") || url.searchParams.get("q") || "";
  const country = url.searchParams.get("country") || "au";
  if (!postcode) {
    return NextResponse.json({ error: "Missing postcode", example: "/au-check/postcode?postcode=2000" }, { status: 400 });
  }
  return withX402(req, { price: "0.01", description: `Postcode ${postcode}` }, async () => {
    try {
      const data = await postcodeLookup(postcode, country);
      return NextResponse.json({ brand: "Milypay", source: "Checkify", postcode, country, data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
