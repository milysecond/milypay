import { NextResponse } from "next/server";
import {
  completeEmailVerification,
  errorToResponse,
  initEmailVerification,
} from "@/lib/doma";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** POST /domains/doma/contacts/init-email  { email } */
export async function POST(req: Request) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = String(body.email || "").trim();
  } catch {
    return NextResponse.json({ error: "JSON body required", code: "bad_request" }, { status: 400 });
  }

  const gateReq = new Request(req.url, { method: "POST", headers: req.headers });
  return withX402(
    gateReq,
    { price: "0.01", description: "Doma initiate email verification" },
    async () => {
      try {
        if (!email.includes("@")) {
          return NextResponse.json({ error: "valid email required", code: "bad_request" }, { status: 400 });
        }
        await initEmailVerification(email);
        return NextResponse.json({
          brand: "Milypay",
          provider: "doma",
          ok: true,
          email,
          next: "POST /domains/doma/contacts/complete-email with {email, code}",
        });
      } catch (e) {
        const { status, body } = errorToResponse(e);
        return NextResponse.json(body, { status });
      }
    },
  );
}
