import { NextResponse } from "next/server";
import { CheckifyError } from "./checkify";

export function checkifyFail(e: unknown) {
  if (e instanceof CheckifyError) {
    const status = e.status === 401 || e.status === 403 ? 502 : e.status === 503 ? 503 : e.status >= 400 && e.status < 500 ? e.status : 502;
    return NextResponse.json(
      {
        error: e.message,
        code: e.status === 503 ? "not_configured" : "checkify_error",
        brand: "Milypay",
        docs: "https://milypay.xyz/agents.md",
      },
      { status },
    );
  }
  const msg = e instanceof Error ? e.message : "checkify failed";
  return NextResponse.json({ error: msg, code: "checkify_error", brand: "Milypay" }, { status: 502 });
}
