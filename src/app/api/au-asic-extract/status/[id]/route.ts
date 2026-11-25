import { NextResponse } from "next/server";
import { extractStatus, isSafeExtractId, okJson, relayFail, tokenFromRequest, verifyExtractToken } from "@/lib/acceleon";
import { apiError } from "@/lib/errors";
import { isThrottled } from "@/lib/throttle";

export const dynamic = "force-dynamic";

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
  if (await isThrottled(req)) return apiError(429, "rate_limited", "Rate limit exceeded. Poll every 5-10s.");
  try {
    const status = await extractStatus(id);
    return okJson({ extractId: id, kind: tok.k, nni: tok.n, status, complete: /^complete$/i.test(status) });
  } catch (e) {
    return relayFail(e);
  }
}
