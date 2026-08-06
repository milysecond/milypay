import { NextResponse } from "next/server";
import { getAlerts, getSummary, getTripUpdates, getVehicles } from "@/lib/transit";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ region: string; feed: string }> };

/**
 * GET /au-transit/{region}/{feed}
 * region: seq | sa
 * feed: vehicles | trip-updates | alerts | summary
 */
export async function GET(req: Request, { params }: Ctx) {
  const { region, feed } = await params;
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : undefined;
  const routeId =
    url.searchParams.get("routeId") || url.searchParams.get("route") || undefined;
  const stopId =
    url.searchParams.get("stopId") || url.searchParams.get("stop") || undefined;
  const mode = url.searchParams.get("mode") || undefined;

  const feedKey = feed.toLowerCase();
  const price =
    feedKey === "summary" ? "0.002" : feedKey === "alerts" ? "0.002" : "0.003";

  return withX402(
    req,
    {
      price,
      description: `AU transit ${region}/${feedKey}${mode ? `/${mode}` : ""}`,
    },
    async () => {
      try {
        let data: unknown;
        switch (feedKey) {
          case "vehicles":
          case "vehicle":
          case "vehicle-positions":
            data = await getVehicles(region, { limit, routeId, mode });
            break;
          case "trip-updates":
          case "trips":
          case "trip_updates":
            data = await getTripUpdates(region, { limit, routeId, stopId, mode });
            break;
          case "alerts":
          case "service-alerts":
            data = await getAlerts(region, { limit, routeId, mode });
            break;
          case "summary":
            data = await getSummary(region, { mode });
            break;
          default:
            return NextResponse.json(
              {
                error: `Unknown feed '${feed}'. Use vehicles | trip-updates | alerts | summary`,
                code: "bad_request",
                brand: "Milypay",
              },
              { status: 400 },
            );
        }
        return NextResponse.json(data, {
          headers: { "Cache-Control": "public, max-age=15" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "transit feed failed";
        const status = msg.includes("Unknown region") ? 404 : 502;
        return NextResponse.json({ error: msg }, { status });
      }
    },
  );
}
