import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return new NextResponse("google-site-verification: googleb787913ba29840de.html", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
