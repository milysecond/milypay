import { NextResponse } from "next/server";
import { emailCheck } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || url.searchParams.get("q") || "";
  if (!email) {
    return NextResponse.json({ error: "Missing email", example: "/au-check/email?email=hello%40example.com" }, { status: 400 });
  }
  return withX402(req, { price: "0.01", description: `Email ${email.slice(0, 24)}` }, async () => {
    try {
      const data = await emailCheck(email);
      return NextResponse.json({ brand: "Milypay", source: "Checkify", data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
