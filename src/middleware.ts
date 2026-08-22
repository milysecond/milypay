import { NextResponse, type NextRequest } from "next/server";
import {
  MD_404,
  markdownForPath,
  wantsJson,
  wantsMarkdown,
} from "@/lib/agent-markdown";

const CANONICAL_HOST = "milypay.xyz";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, PAYMENT-SIGNATURE, X-PAYMENT, payment-signature",
  "Access-Control-Expose-Headers":
    "PAYMENT-REQUIRED, PAYMENT-RESPONSE, payment-required, payment-response",
  "Access-Control-Max-Age": "86400",
};

const KNOWN_SITE = new Set([
  "/",
  "/about",
  "/privacy",
  "/contact",
  "/docs",
  "/demo",
  "/quickstart",
  "/stables",
  "/fund",
  "/dashboard",
  "/pay",
  "/status",
  "/ops",
  "/mcp",
  "/agents.md",
  "/llms.txt",
  "/llms-full.txt",
  "/openapi.json",
  "/openapi",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
]);

function isPreviewHost(host: string) {
  return (
    host.endsWith(".workers.dev") ||
    host.endsWith(".pages.dev") ||
    host.includes("localhost") ||
    host.startsWith("127.0.0.1")
  );
}

function withVary(res: NextResponse) {
  const prev = res.headers.get("Vary");
  const parts = new Set(
    (prev || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  parts.add("Accept");
  res.headers.set("Vary", Array.from(parts).join(", "));
  return res;
}

function mdResponse(body: string, status = 200) {
  const res = new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": status === 404 ? "no-store" : "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
  return withVary(res);
}

function jsonResponse(data: unknown, status = 200) {
  const res = NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": status >= 400 ? "no-store" : "public, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
  return withVary(res);
}

function isProbablyStatic(pathname: string) {
  return /\.(ico|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|css|js|map|txt|xml|json|webmanifest)$/i.test(
    pathname,
  );
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const { pathname, search } = req.nextUrl;
  const proto =
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol.replace(":", "") ||
    "https";
  const accept = req.headers.get("accept");
  const method = req.method.toUpperCase();

  // Preview / workers.dev
  if (isPreviewHost(host) && !host.includes("localhost") && !host.startsWith("127.")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (pathname.startsWith("/api/")) {
      for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
    }
    return withVary(res);
  }

  const isApiHost = host === `api.${CANONICAL_HOST}` || host.startsWith("api.");
  if (isApiHost || pathname.startsWith("/api/")) {
    if (proto === "http" && !isPreviewHost(host)) {
      return NextResponse.redirect(new URL(`https://${host}${pathname}${search}`), 301);
    }
    if (method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: CORS });
    }

    // JSON 404 for unknown API-looking paths is handled by catch-all route;
    // still add CORS + Vary on the way through.
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
    return withVary(res);
  }

  if (proto === "http" && !isPreviewHost(host)) {
    return NextResponse.redirect(new URL(`https://${host}${pathname}${search}`), 301);
  }

  if (host === `www.${CANONICAL_HOST}`) {
    return NextResponse.redirect(
      new URL(`https://${CANONICAL_HOST}${pathname}${search}`),
      301,
    );
  }

  // --- Agent content negotiation (marketing host) ---
  if (method === "GET" || method === "HEAD") {
    const md = wantsMarkdown(accept);
    const json = wantsJson(accept) && !accept?.includes("text/html");

    // Known markdown pages
    if (md) {
      const body = markdownForPath(pathname);
      if (body) return mdResponse(body, 200);
    }

    // Unknown path: agent-friendly 404 (skip next internals & real static)
    const clean = pathname.replace(/\/+$/, "") || "/";
    const known =
      KNOWN_SITE.has(clean) ||
      KNOWN_SITE.has(pathname) ||
      pathname.startsWith("/.well-known/") ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      isProbablyStatic(pathname);

    if (!known && !pathname.startsWith("/api/")) {
      if (md) return mdResponse(MD_404, 404);
      if (json) {
        return jsonResponse(
          {
            error: "Not Found",
            code: "not_found",
            brand: "Milypay",
            message: "This path does not exist on milypay.xyz",
            resolution:
              "See https://milypay.xyz/agents.md, https://milypay.xyz/openapi.json, https://milypay.xyz/sitemap.xml",
            docs: "https://milypay.xyz/agents.md",
            openapi: "https://milypay.xyz/openapi.json",
            x402: "https://milypay.xyz/.well-known/x402",
          },
          404,
        );
      }
      // HTML 404 still via not-found.tsx when Next resolves; for hard 404 with body
      // we only force when Accept prefers non-HTML
    }
  }

  const res = NextResponse.next();
  return withVary(res);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|fonts/).*)"],
};
