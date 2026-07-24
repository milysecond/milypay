// Business API (businessapi.com.au) client.
// Use ONLY for paid/official products that free government APIs do not cover.
//
// Free gov sources (prefer these elsewhere in Milypay):
//   - ABR ABN Lookup (ABR_GUID)         -> au-business
//   - ASIC open company register (Turso) -> au-company acn/search
//   - ATO Super Fund Lookup             -> au-super
//
// Business API is reserved for:
//   - Official ASIC company extracts (directors, office, share capital, charges)
//     Free open data does not include officeholders or shareholdings.
//
// Config (Worker secrets / .env.local):
//   BAPI_SECRET_KEY       bapi_sk_live_... (server only)
//   BAPI_BASE_URL         default https://businessapi.com.au/api/v2

const DEFAULT_BASE = "https://businessapi.com.au/api/v2";

function baseUrl(): string {
  return (process.env.BAPI_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
}

function secretKey(): string {
  const k = process.env.BAPI_SECRET_KEY;
  if (!k) throw new Error("BAPI_SECRET_KEY is not configured");
  return k;
}

export class BusinessApiError extends Error {
  status: number;
  code: string | null;
  body: unknown;

  constructor(status: number, message: string, code: string | null = null, body: unknown = null) {
    super(message);
    this.name = "BusinessApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }

  /** True when the BAPI account needs a saved card before paid production endpoints work. */
  get needsPaymentMethod(): boolean {
    return this.status === 402 || this.code === "payment_method_required";
  }
}

async function bapiFetch<T = unknown>(
  path: string,
  init: RequestInit & { query?: Record<string, string | undefined> } = {},
): Promise<T> {
  const url = new URL(`${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const { query: _q, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${secretKey()}`);
  }
  if (fetchInit.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const res = await fetch(url.toString(), { ...fetchInit, headers });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
    const code = typeof rec?.error === "string" ? rec.error : null;
    const message =
      (typeof rec?.message === "string" && rec.message) ||
      (typeof rec?.error === "string" && rec.error) ||
      `Business API upstream ${res.status}`;
    throw new BusinessApiError(res.status, message, code, body);
  }

  return body as T;
}

// ---- Company extracts only (not available from free ASIC open data / ABR) ----

export type ExtractOrderBody = {
  acn?: string;
  abn?: string;
  extractType?: string;
  [key: string]: unknown;
};

/**
 * Order an official ASIC company extract via Business API.
 * Upstream: POST /api/v2/asic/extracts (secret key).
 * Free ASIC open data and ABR do not include directors, secretaries, or shareholders.
 */
export async function orderCompanyExtract(body: ExtractOrderBody): Promise<unknown> {
  if (!body.acn && !body.abn) {
    throw new BusinessApiError(400, "acn or abn is required");
  }
  const payload = { ...body };
  if (payload.acn) payload.acn = payload.acn.replace(/\D/g, "").padStart(9, "0");
  if (payload.abn) payload.abn = payload.abn.replace(/\D/g, "");
  return bapiFetch("/asic/extracts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestStatus(requestId: string | number): Promise<unknown> {
  return bapiFetch(`/status/${requestId}`, { method: "GET" });
}

export async function accountStatus(): Promise<unknown> {
  return bapiFetch("/account-status", { method: "GET" });
}

/**
 * Readiness for paid extract endpoints (requires BAPI secret + dashboard card).
 */
export async function businessApiReadiness(): Promise<{
  configured: boolean;
  paidOk: boolean;
  message: string;
}> {
  if (!process.env.BAPI_SECRET_KEY) {
    return {
      configured: false,
      paidOk: false,
      message: "BAPI_SECRET_KEY not configured",
    };
  }

  try {
    await accountStatus();
    return { configured: true, paidOk: true, message: "ok" };
  } catch (e) {
    if (e instanceof BusinessApiError && e.needsPaymentMethod) {
      return {
        configured: true,
        paidOk: false,
        message: "Add a saved payment method in the Business API dashboard to unlock extracts",
      };
    }
    return {
      configured: true,
      paidOk: false,
      message: e instanceof Error ? e.message : "account-status failed",
    };
  }
}
