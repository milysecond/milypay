import { NextResponse } from "next/server";
import { businessNameCheck } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || url.searchParams.get("q") || "";
  if (!name) {
    return NextResponse.json({ error: "Missing name", example: "/au-check/business-name?name=The+Coffee+Collective" }, { status: 400 });
  }
  return withX402(req, { price: "0.01", description: `Business name ${name.slice(0, 32)}` }, async () => {
    try {
      const data = await businessNameCheck(name);
      return NextResponse.json({ brand: "Milypay", source: "Checkify", data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
