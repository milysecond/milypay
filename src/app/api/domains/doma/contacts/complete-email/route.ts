import { NextResponse } from "next/server";
import { completeEmailVerification, errorToResponse } from "@/lib/doma";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/** POST /domains/doma/contacts/complete-email  { email, code } */
export async function POST(req: Request) {
  let email = "";
  let code = "";
  try {
    const body = (await req.json()) as { email?: string; code?: string };
    email = String(body.email || "").trim();
    code = String(body.code || "").trim();
  } catch {
    return NextResponse.json({ error: "JSON body required", code: "bad_request" }, { status: 400 });
  }

  const gateReq = new Request(req.url, { method: "POST", headers: req.headers });
  return withX402(
    gateReq,
    { price: "0.01", description: "Doma complete email verification" },
    async () => {
      try {
        if (!email || !code) {
          return NextResponse.json(
            { error: "email and code required", code: "bad_request" },
            { status: 400 },
          );
        }
        const { proof } = await completeEmailVerification(email, code);
        return NextResponse.json({
          brand: "Milypay",
          provider: "doma",
          ok: true,
          email,
          emailVerificationProof: proof,
          next: "POST /domains/doma/register with emailVerificationProof + contact.email matching",
        });
      } catch (e) {
        const { status, body } = errorToResponse(e);
        return NextResponse.json(body, { status });
      }
    },
  );
}
