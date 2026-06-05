import { NextResponse, type NextRequest } from "next/server";

// CORS for the API so browser clients (e.g. the /pay wallet demo on milypay.xyz)
// can call api.milypay.xyz cross-origin, including the x402 payment headers.
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, payment-signature",
  "Access-Control-Expose-Headers":
    "PAYMENT-REQUIRED, PAYMENT-RESPONSE, payment-required, payment-response",
  "Access-Control-Max-Age": "86400",
};

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  const isApi = host.startsWith("api.") || req.nextUrl.pathname.startsWith("/api/");
  if (!isApi) return NextResponse.next();

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
