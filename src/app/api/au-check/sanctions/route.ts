import { NextResponse } from "next/server";
import { sanctionsScreen } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || url.searchParams.get("q") || "";
  if (name.length < 3) {
    return NextResponse.json({ error: "Missing name (min 3 chars)", example: "/au-check/sanctions?name=Mohammad+Hassan" }, { status: 400 });
  }
  return withX402(req, { price: "0.03", description: `Sanctions ${name.slice(0, 24)}` }, async () => {
    try {
      const data = await sanctionsScreen({
        name,
        birth_year: url.searchParams.get("birth_year") || undefined,
        country: url.searchParams.get("country") || undefined,
        city: url.searchParams.get("city") || undefined,
      });
      return NextResponse.json({ brand: "Milypay", source: "Checkify", data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
