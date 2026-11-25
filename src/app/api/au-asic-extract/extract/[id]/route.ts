import { NextResponse } from "next/server";
import { downloadExtract, isSafeExtractId, okJson, relayFail, tokenFromRequest, verifyExtractToken } from "@/lib/acceleon";
import { apiError } from "@/lib/errors";
import { isThrottled } from "@/lib/throttle";

export const dynamic = "force-dynamic";

/** Download a purchased extract. ?format=pdf returns application/pdf; ?pdf=1 adds pdfBase64 to JSON. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSafeExtractId(id)) return NextResponse.json({ error: "Invalid extract ID" }, { status: 400 });
  const tok = await verifyExtractToken(tokenFromRequest(req), id).catch(() => null);
  if (!tok) {
    return NextResponse.json(
      { error: "Valid buyer token required (?token= from the purchase response, or X-Extract-Token header)" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (await isThrottled(req)) return apiError(429, "rate_limited", "Rate limit exceeded.");
  const url = new URL(req.url);
  const asPdf = (url.searchParams.get("format") || "").toLowerCase() === "pdf";
  const wantPdf = asPdf || ["1", "true", "yes"].includes((url.searchParams.get("pdf") || "").toLowerCase());
  try {
    const ex = await downloadExtract(id, wantPdf);
    if (asPdf) {
      if (!ex.pdfBase64) return NextResponse.json({ error: "PDF not available yet. Check status." }, { status: 409 });
      const bin = atob(ex.pdfBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="asic-extract-${id}-UAT.pdf"`,
          "Cache-Control": "private, no-store",
          "x-acceleon-environment": "UAT",
        },
      });
    }
    return okJson({
      extractId: id,
      kind: tok.k,
      nni: tok.n,
      extractType: ex.extractType,
      extractDate: ex.extractDate,
      data: ex.data,
      fullData: ex.fullData,
      ...(wantPdf ? { pdfBase64: ex.pdfBase64, pdfBytes: ex.pdfBase64 ? Math.floor((ex.pdfBase64.length * 3) / 4) : 0 } : {}),
    });
  } catch (e) {
    return relayFail(e);
  }
}
