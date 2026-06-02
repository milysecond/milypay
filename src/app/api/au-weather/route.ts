import { NextResponse } from "next/server";
import { getWeather } from "@/lib/weather";
import { geocodeAddress } from "@/lib/gnaf";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Weather by Open-Meteo.com (CC BY 4.0). Australian model: BOM ACCESS-G.";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const days = Number(searchParams.get("days") || "7");

  return withX402(req, { price: "0.001", description: `Weather forecast` }, async () => {
    try {
      let lat: number;
      let lng: number;
      let address: string | undefined;

      if (q && q.trim()) {
        const geo = await geocodeAddress(q);
        if (!geo.found || geo.lat == null || geo.lng == null) {
          return NextResponse.json({ error: "Address not found" }, { status: 404 });
        }
        lat = geo.lat;
        lng = geo.lng;
        address = geo.address;
      } else if (latParam && lngParam) {
        lat = Number(latParam);
        lng = Number(lngParam);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Provide q=<address> or lat & lng" }, { status: 400 });
      }

      const weather = await getWeather(lat, lng, Number.isFinite(days) ? days : 7);
      return NextResponse.json(
        { location: { lat, lng, address, timezone: weather.timezone }, ...weather, attribution: ATTRIBUTION },
        { headers: { "Cache-Control": "public, max-age=1800", "x-data-source": ATTRIBUTION } },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "weather lookup failed";
      const status = msg.includes("TURSO") ? 503 : 502;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
