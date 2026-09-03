import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/checkify";
import { checkifyFail } from "@/lib/checkify-http";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat") || "";
  const lng = url.searchParams.get("lng") || url.searchParams.get("lon") || "";
  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng", example: "/au-check/reverse?lat=-33.8688&lng=151.2093" }, { status: 400 });
  }
  return withX402(req, { price: "0.01", description: `Reverse geocode ${lat},${lng}` }, async () => {
    try {
      const data = await reverseGeocode(
        lat,
        lng,
        url.searchParams.get("radius") || undefined,
        url.searchParams.get("limit") || undefined,
        url.searchParams.get("country") || "au",
      );
      return NextResponse.json({ brand: "Milypay", source: "Checkify", lat, lng, data });
    } catch (e) {
      return checkifyFail(e);
    }
  });
}
