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
//   BAPI_SECRET_KEY            bapi_sk_live_... (production)
//   BAPI_TEST_SECRET_KEY       bapi_sk_test_... (sandbox)
//   BAPI_ENV                   "live" (default) | "test"
//   BAPI_BASE_URL              optional override
//
// Sandbox base: https://businessapi.com.au/api/test/v2
// Live base:    https://businessapi.com.au/api/v2
//
// Extract body (verified against sandbox):
//   POST /asic/extracts
//   { "generalInformation": { "acn": "000014675", "type": "current" | "historical" } }
//   -> 202 { requestId, status, acn }
//   GET  /asic/extracts/{requestId}/pdf -> PDF bytes

const LIVE_BASE = "https://businessapi.com.au/api/v2";
const TEST_BASE = "https://businessapi.com.au/api/test/v2";

export type ExtractType = "current" | "historical";

function envMode(): "live" | "test" {
  const m = (process.env.BAPI_ENV || "live").toLowerCase();
  return m === "test" ? "test" : "live";
}

function baseUrl(): string {
  if (process.env.BAPI_BASE_URL) return process.env.BAPI_BASE_URL.replace(/\/$/, "");
  return envMode() === "test" ? TEST_BASE : LIVE_BASE;
}

function secretKey(): string {
  if (envMode() === "test") {
    const k = process.env.BAPI_TEST_SECRET_KEY || process.env.BAPI_SECRET_KEY;
    if (!k) throw new Error("BAPI_TEST_SECRET_KEY is not configured");
    return k;
  }
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
  init: RequestInit & { query?: Record<string, string | undefined>; raw?: boolean } = {},
): Promise<T> {
  const url = new URL(`${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const { query: _q, raw, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${secretKey()}`);
  }
  if (fetchInit.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", raw ? "application/pdf, application/json, */*" : "application/json");
  }

  const res = await fetch(url.toString(), { ...fetchInit, headers });

  if (raw) {
    if (!res.ok) {
      const text = await res.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        /* keep text */
      }
      const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
      const code = typeof rec?.error === "string" ? rec.error : null;
      throw new BusinessApiError(res.status, `Business API upstream ${res.status}`, code, body);
    }
    return (await res.arrayBuffer()) as T;
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  // 202 Accepted is success for async extract orders.
  if (!res.ok) {
    const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
    const code = typeof rec?.error === "string" ? rec.error : null;
    let message =
      (typeof rec?.message === "string" && rec.message) ||
      (typeof rec?.error === "string" && rec.error) ||
      `Business API upstream ${res.status}`;
    // Flatten validation errors when present.
    if (rec?.errors && typeof rec.errors === "object") {
      const parts = Object.entries(rec.errors as Record<string, unknown>).map(([k, v]) => {
        const val = Array.isArray(v) ? v.join("; ") : String(v);
        return `${k}: ${val}`;
      });
      if (parts.length) message = parts.join(" | ");
    }
    throw new BusinessApiError(res.status, message, code, body);
  }

  return body as T;
}

// ---- Company extracts only (not available from free ASIC open data / ABR) ----

export interface ExtractOrderResult {
  requestId: number | string;
  status: string;
  acn?: string;
  warnings?: unknown;
  errors?: unknown;
  raw: unknown;
}

export interface ExtractStatus {
  requestId: number | string;
  status: string;
  documentNumber?: string | null;
  warnings?: unknown;
  errors?: unknown;
  raw: unknown;
}

function cleanAcn(acn: string): string | null {
  const digits = acn.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 9) return null;
  return digits.padStart(9, "0");
}

function normalizeExtractType(type?: string): ExtractType {
  const t = (type || "current").toLowerCase().trim();
  if (t === "historical" || t === "hist" || t === "h") return "historical";
  if (t === "current" || t === "curr" || t === "c" || t === "") return "current";
  throw new BusinessApiError(400, 'extract type must be "current" or "historical"');
}

/**
 * Order an official ASIC company extract via Business API.
 * Upstream: POST /asic/extracts
 * Body: { generalInformation: { acn, type: "current" | "historical" } }
 */
export async function orderCompanyExtract(
  acn: string,
  extractType: string = "current",
): Promise<ExtractOrderResult> {
  const clean = cleanAcn(acn);
  if (!clean) throw new BusinessApiError(400, "ACN must be up to 9 digits");
  const type = normalizeExtractType(extractType);

  const raw = await bapiFetch<Record<string, unknown>>("/asic/extracts", {
    method: "POST",
    body: JSON.stringify({
      generalInformation: { acn: clean, type },
    }),
  });

  // Some responses nest under response; sandbox returns flat { requestId, status, acn }.
  const nested =
    raw.response && typeof raw.response === "object"
      ? (raw.response as Record<string, unknown>)
      : raw;

  const requestId = nested.requestId ?? raw.requestId;
  if (requestId == null) {
    throw new BusinessApiError(502, "Business API did not return a requestId", null, raw);
  }

  return {
    requestId: requestId as number | string,
    status: String(nested.status ?? raw.status ?? "accepted"),
    acn: typeof nested.acn === "string" ? nested.acn : clean,
    warnings: nested.warnings ?? raw.warnings,
    errors: nested.errors ?? raw.errors,
    raw,
  };
}

export async function getExtractStatus(requestId: string | number): Promise<ExtractStatus> {
  const raw = await bapiFetch<Record<string, unknown>>(`/asic/extracts/${requestId}`, {
    method: "GET",
  });
  return {
    requestId: (raw.requestId as number | string) ?? requestId,
    status: String(raw.status ?? "unknown"),
    documentNumber: (raw.documentNumber as string | null | undefined) ?? null,
    warnings: raw.warnings,
    errors: raw.errors,
    raw,
  };
}

export async function getExtractPdf(requestId: string | number): Promise<ArrayBuffer> {
  return bapiFetch<ArrayBuffer>(`/asic/extracts/${requestId}/pdf`, {
    method: "GET",
    raw: true,
  });
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Order extract, wait briefly for finish, return status + optional PDF (base64).
 * Sandbox often finishes immediately; live may stay pending longer.
 */
export async function orderAndFetchExtract(
  acn: string,
  extractType: string = "current",
  opts: { waitMs?: number; pollMs?: number } = {},
): Promise<{
  acn: string;
  type: ExtractType;
  requestId: number | string;
  status: string;
  documentNumber?: string | null;
  pdfBase64?: string;
  pdfBytes?: number;
  environment: "live" | "test";
}> {
  const type = normalizeExtractType(extractType);
  const order = await orderCompanyExtract(acn, type);
  const waitMs = opts.waitMs ?? 8000;
  const pollMs = opts.pollMs ?? 1000;
  const deadline = Date.now() + waitMs;

  let status = order.status;
  let documentNumber: string | null | undefined = null;

  while (Date.now() < deadline) {
    const st = await getExtractStatus(order.requestId);
    status = st.status;
    documentNumber = st.documentNumber;
    if (/finish|complete|done|ready/i.test(status)) break;
    if (/fail|error|reject/i.test(status)) {
      throw new BusinessApiError(502, `Extract ${status}`, null, st.raw);
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }

  const result: {
    acn: string;
    type: ExtractType;
    requestId: number | string;
    status: string;
    documentNumber?: string | null;
    pdfBase64?: string;
    pdfBytes?: number;
    environment: "live" | "test";
  } = {
    acn: order.acn || cleanAcn(acn) || acn,
    type,
    requestId: order.requestId,
    status,
    documentNumber,
    environment: envMode(),
  };

  if (/finish|complete|done|ready/i.test(status)) {
    try {
      const pdf = await getExtractPdf(order.requestId);
      result.pdfBase64 = bufToBase64(pdf);
      result.pdfBytes = pdf.byteLength;
    } catch {
      // Status finished but PDF not yet available; return status without PDF.
    }
  }

  return result;
}

export async function requestStatus(requestId: string | number): Promise<unknown> {
  return bapiFetch(`/status/${requestId}`, { method: "GET" });
}

export async function accountStatus(): Promise<unknown> {
  return bapiFetch("/account-status", { method: "GET" });
}

/**
 * Readiness for extract endpoints.
 * Test env uses test secret (no card required). Live needs secret + dashboard card.
 */
export async function businessApiReadiness(): Promise<{
  configured: boolean;
  paidOk: boolean;
  environment: "live" | "test";
  message: string;
}> {
  const environment = envMode();
  const configured =
    environment === "test"
      ? Boolean(process.env.BAPI_TEST_SECRET_KEY || process.env.BAPI_SECRET_KEY)
      : Boolean(process.env.BAPI_SECRET_KEY);

  if (!configured) {
    return {
      configured: false,
      paidOk: false,
      environment,
      message:
        environment === "test"
          ? "BAPI_TEST_SECRET_KEY not configured"
          : "BAPI_SECRET_KEY not configured",
    };
  }

  try {
    await accountStatus();
    return { configured: true, paidOk: true, environment, message: "ok" };
  } catch (e) {
    if (e instanceof BusinessApiError && e.needsPaymentMethod) {
      return {
        configured: true,
        paidOk: false,
        environment,
        message: "Add a saved payment method in the Business API dashboard to unlock live extracts",
      };
    }
    return {
      configured: true,
      paidOk: false,
      environment,
      message: e instanceof Error ? e.message : "account-status failed",
    };
  }
}
