import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "milypay.xyz";

// CORS for the API so browser clients (e.g. the /pay wallet demo on milypay.xyz)
// can call api.milypay.xyz cross-origin, including the x402 payment headers.
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, payment-signature",
  "Access-Control-Expose-Headers":
    "PAYMENT-REQUIRED, PAYMENT-RESPONSE, payment-required, payment-response",
  "Access-Control-Max-Age": "86400",
};

function isPreviewHost(host: string) {
  return (
    host.endsWith(".workers.dev") ||
    host.endsWith(".pages.dev") ||
    host.includes("localhost") ||
    host.startsWith("127.0.0.1")
  );
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const { pathname, search } = req.nextUrl;
  const proto =
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol.replace(":", "") ||
    "https";

  // Preview / workers.dev must not compete in Google with the custom domain
  if (isPreviewHost(host) && !host.includes("localhost") && !host.startsWith("127.")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    // Still apply CORS on API paths if hit via preview
    if (pathname.startsWith("/api/")) {
      for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
    }
    return res;
  }

  // API host: CORS only (never apex-redirect api.milypay.xyz)
  const isApiHost = host === `api.${CANONICAL_HOST}` || host.startsWith("api.");
  if (isApiHost || pathname.startsWith("/api/")) {
    // Force HTTPS on API host too
    if (proto === "http" && !isPreviewHost(host)) {
      return NextResponse.redirect(
        new URL(`https://${host}${pathname}${search}`),
        301,
      );
    }
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: CORS });
    }
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
    return res;
  }

  // Marketing site: force HTTPS
  if (proto === "http" && !isPreviewHost(host)) {
    return NextResponse.redirect(
      new URL(`https://${host}${pathname}${search}`),
      301,
    );
  }

  // www → apex (canonical for GSC / avoid duplicate without user-selected)
  if (host === `www.${CANONICAL_HOST}`) {
    return NextResponse.redirect(
      new URL(`https://${CANONICAL_HOST}${pathname}${search}`),
      301,
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|fonts/).*)"],
};
