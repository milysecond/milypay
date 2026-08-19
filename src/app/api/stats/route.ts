import { NextResponse } from "next/server";
import { collectUsageStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

/** GET /stats — aggregated usage (GA4 + npm + status) */
export async function GET() {
  try {
    const stats = await collectUsageStats();
    return NextResponse.json(stats, {
      headers: {
        "cache-control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "stats_failed",
        brand: "Milypay",
      },
      { status: 502 },
    );
  }
}
