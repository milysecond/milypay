import { NextResponse } from "next/server";
import { companyNameCheck } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || url.searchParams.get("q") || "";
  if (!name) {
    return NextResponse.json({ error: "Missing name", example: "/au-check/company-name?name=Acme+Holdings" }, { status: 400 });
  }
  return withX402(req, { price: "0.01", description: `Company name ${name.slice(0, 32)}` }, async () => {
    try {
      const data = await companyNameCheck(name);
      return NextResponse.json({ brand: "Milypay", source: "Checkify", data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
