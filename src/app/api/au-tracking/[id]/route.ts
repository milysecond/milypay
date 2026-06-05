import { NextResponse } from "next/server";
import { trackParcel } from "@/lib/auspost";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ATTRIBUTION = "Source: Australia Post Shipping & Tracking";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withX402(req, { price: "0.002", description: `Track parcel ${id}` }, async () => {
    try {
      const result = await trackParcel(id);
      if ("error" in result) return NextResponse.json(result, { status: 404 });
      return NextResponse.json(
        { ...result, attribution: ATTRIBUTION },
        { headers: { "Cache-Control": "public, max-age=300", "x-data-source": ATTRIBUTION } },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "tracking failed";
      const status = msg.includes("AUSPOST_API_KEY") ? 503 : 502;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
