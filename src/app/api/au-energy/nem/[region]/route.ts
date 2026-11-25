import { NextResponse } from "next/server";
import { getNemRegion } from "@/lib/energy";
import { withX402 } from "@/lib/x402";
import { energyUnavailable } from "@/lib/upstream-health";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ region: string }> };

/** GET /au-energy/nem/{region} — single NEM region (NSW1/VIC1/…) */
export async function GET(req: Request, { params }: Ctx) {
  const { region } = await params;
  return withX402(
    req,
    { price: "0.002", description: `AEMO NEM live ${region}` },
    async () => {
      try {
        const data = await getNemRegion(region);
        return NextResponse.json(data, {
          headers: { "Cache-Control": "public, max-age=30" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("Unknown NEM region")) {
          return NextResponse.json({ error: msg, code: "not_found", brand: "Milypay" }, { status: 404 });
        }
        return energyUnavailable(e);
      }
    },
  );
}
