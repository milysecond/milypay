import { NextResponse } from "next/server";
import { getData, absErrorResponse } from "@/lib/abs";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * GET /au-abs/data/{dataflow}?key=&startPeriod=&endPeriod=
 * Fetch SDMX series from ABS Data API, normalised to JSON series/observations.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ dataflow: string }> },
) {
  const { dataflow } = await params;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || undefined;
  const startPeriod = url.searchParams.get("startPeriod") || url.searchParams.get("start") || undefined;
  const endPeriod = url.searchParams.get("endPeriod") || url.searchParams.get("end") || undefined;
  const version = url.searchParams.get("version") || undefined;
  const maxRaw = Number(url.searchParams.get("maxSeries") || url.searchParams.get("limit") || "");
  const maxSeries = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : undefined;

  // Guard huge pulls: require key or startPeriod when key=all
  const resolvedKey = key || "all";
  if (resolvedKey === "all" && !startPeriod) {
    return NextResponse.json(
      {
        error:
          "Provide key= (SDMX series key) and/or startPeriod= to bound the query. Example: /au-abs/data/CPI?key=1.10001.10.50.Q&startPeriod=2020",
        code: "bad_request",
        brand: "Milypay",
        docs: "https://milypay.xyz/agents.md",
      },
      { status: 400 },
    );
  }

  return withX402(
    req,
    {
      price: "0.005",
      description: `ABS data ${dataflow}${key ? ` key=${key}` : ""}`,
    },
    async () => {
      try {
        const result = await getData({
          dataflow,
          key: resolvedKey,
          startPeriod,
          endPeriod,
          version,
          maxSeries,
        });
        return NextResponse.json(result, {
          headers: { "Cache-Control": "public, max-age=1800" },
        });
      } catch (e) {
        return absErrorResponse(e);
      }
    },
  );
}
