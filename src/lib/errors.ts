import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "payment_required"
  | "rate_limited"
  | "bad_request"
  | "not_found"
  | "upstream_error"
  | "payment_not_configured"
  | "verification_unavailable"
  | "service_unavailable"
  | "internal_error";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra?: Record<string, unknown>,
  headers?: HeadersInit,
) {
  const body = {
    error: message,
    code,
    brand: "Milypay" as const,
    docs: "https://milypay.xyz/agents.md",
    ...extra,
  };
  const h = new Headers(headers);
  if (!h.has("content-type")) h.set("content-type", "application/json");
  if (status === 429 && !h.has("retry-after")) h.set("retry-after", "60");
  return new NextResponse(JSON.stringify(body), { status, headers: h });
}
