import { NextResponse } from "next/server";
import {
  PRICES,
  isSafeNni,
  normalizeNni,
  okJson,
  purchaseExtract,
  relayFail,
  signExtractToken,
  type OrgKind,
} from "@/lib/acceleon";
import { withX402 } from "@/lib/x402";

export const dynamic = "force-dynamic";

type Body = { nni?: string; acn?: string; kind?: string; type?: string; notes?: string };

/**
 * Buy an ASIC extract (Acceleon UAT test mode). Always paid via x402.
 * Body: { nni, kind: "company"|"business", type: "current"|"historical", notes? }
 * Returns the extract ID plus a signed buyer token for status + download.
 * The handler runs after x402 /verify; if the upstream purchase fails the
 * response is non-2xx and the payment is NOT settled.
 */
export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON body required: {\"nni\":\"695484756\",\"kind\":\"company\",\"type\":\"current\"}" }, { status: 400 });
  }
  const nni = normalizeNni(String(body.nni || body.acn || ""));
  const kind: OrgKind = body.kind === "business" ? "business" : "company";
  const type = (body.type || "current").toLowerCase();
  if (!isSafeNni(nni)) return NextResponse.json({ error: "nni required (ACN for companies)" }, { status: 400 });
  if (type !== "current" && type !== "historical") {
    return NextResponse.json({ error: "type must be current or historical" }, { status: 400 });
  }
  const isCurrent = type === "current";
  const price = isCurrent ? PRICES.purchaseCurrent : PRICES.purchaseHistorical;

  return withX402(
    req,
    {
      price,
      description: `ASIC ${kind} extract ${type} (UAT test) ${nni}`,
      alwaysPaid: true,
    },
    async () => {
      try {
        const notes = `milypay x402 ${new Date().toISOString()}`;
        const extractId = await purchaseExtract(kind, nni, isCurrent, notes);
        const { token, expiresAt } = await signExtractToken(extractId, kind, nni);
        const q = `token=${encodeURIComponent(token)}`;
        return okJson(
          {
            extractId,
            kind,
            nni,
            type: isCurrent ? "current" : "current+historical",
            token,
            tokenExpiresAt: expiresAt,
            statusUrl: `/au-asic-extract/status/${extractId}?${q}`,
            downloadUrl: `/au-asic-extract/extract/${extractId}?${q}`,
            pdfUrl: `/au-asic-extract/extract/${extractId}?${q}&format=pdf`,
            hint: "Keep the token: it is the only way to fetch this extract. Poll statusUrl every 5-10s until Complete.",
          },
          { "x-extract-id": extractId },
        );
      } catch (e) {
        return relayFail(e);
      }
    },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Use POST with JSON body",
      example: { nni: "695484756", kind: "company", type: "current" },
      prices: { current: PRICES.purchaseCurrent, historical: PRICES.purchaseHistorical },
      docs: "https://milypay.xyz/docs#asic-extract",
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}
