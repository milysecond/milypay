import { NextResponse } from "next/server";
import { collectOpsData } from "@/lib/ops";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", code: "unauthorized", brand: "Milypay" },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="milypay-ops"' } },
  );
}

function checkAuth(req: Request): boolean {
  const expected = process.env.OPS_TOKEN?.trim();
  if (!expected) return false;

  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    if (auth.slice(7).trim() === expected) return true;
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("token");
  if (q && q === expected) return true;

  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)milypay_ops=([^;]+)/);
  if (m && decodeURIComponent(m[1]) === expected) return true;

  return false;
}

export async function GET(req: Request) {
  if (!process.env.OPS_TOKEN) {
    return NextResponse.json(
      { error: "OPS_TOKEN not configured", code: "not_configured", brand: "Milypay" },
      { status: 503 },
    );
  }
  if (!checkAuth(req)) return unauthorized();

  try {
    const data = await collectOpsData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "ops failed",
        code: "internal_error",
        brand: "Milypay",
      },
      { status: 500 },
    );
  }
}

/** POST { token } → set httpOnly cookie for browser session */
export async function POST(req: Request) {
  const expected = process.env.OPS_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  }

  let body: { token?: string } = {};
  try {
    body = (await req.json()) as { token?: string };
  } catch {
    /* empty */
  }
  const token = (body.token || "").trim();
  if (!token || token !== expected) {
    return NextResponse.json({ ok: false, error: "invalid token" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("milypay_ops", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14d
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("milypay_ops", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
