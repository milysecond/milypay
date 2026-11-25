import { NextResponse } from "next/server";
import { CheckifyError } from "./checkify";

const UNAVAILABLE = "Check service temporarily unavailable";

/**
 * Map Checkify failures to clean responses.
 * - 400/404/422: the input was rejected → 400 with a plain message
 * - anything else (auth, 5xx, not configured, network) → 503
 * Upstream error text is never echoed.
 */
export function checkifyFail(e: unknown, invalidMessage = "Invalid input for this check") {
  if (e instanceof CheckifyError && (e.status === 400 || e.status === 404 || e.status === 422)) {
    return NextResponse.json(
      { error: invalidMessage, code: "bad_request", brand: "Milypay", docs: "https://milypay.xyz/agents.md" },
      { status: 400 },
    );
  }
  console.error("checkify failed", e instanceof CheckifyError ? e.status : "error");
  return NextResponse.json(
    { error: UNAVAILABLE, code: "service_unavailable", brand: "Milypay", docs: "https://milypay.xyz/agents.md" },
    { status: 503 },
  );
}
