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
//
// Environments:
//   live  - bapi_sk_live_* + /api/v2/      (production agents on api.milypay.xyz)
//   test  - bapi_sk_test_* + /api/test/v2/ (website demos on milypay.xyz)
//
// Config (Worker secrets / .env.local):
//   BAPI_SECRET_KEY            bapi_sk_live_...
//   BAPI_TEST_SECRET_KEY       bapi_sk_test_...
//   BAPI_ENV                   optional default when no per-call override
//   BAPI_BASE_URL              optional full base override
//
// Extract body (verified sandbox):
//   POST /asic/extracts
//   { "generalInformation": { "acn": "000014675", "type": "current" | "historical" } }
//   GET  /asic/extracts/{requestId}/pdf -> PDF

const LIVE_BASE = "https://businessapi.com.au/api/v2";
const TEST_BASE = "https://businessapi.com.au/api/test/v2";

export type BapiEnvironment = "live" | "test";
export type ExtractType = "current" | "historical";

export type BapiCallOptions = {
  /** Override env for this call. Website demos use "test"; api host uses "live". */
  environment?: BapiEnvironment;
};

function defaultEnv(): BapiEnvironment {
  const m = (process.env.BAPI_ENV || "live").toLowerCase();
  return m === "test" ? "test" : "live";
}

function resolveEnv(opts?: BapiCallOptions): BapiEnvironment {
  return opts?.environment || defaultEnv();
}

function baseUrl(env: BapiEnvironment): string {
  if (process.env.BAPI_BASE_URL) return process.env.BAPI_BASE_URL.replace(/\/$/, "");
  return env === "test" ? TEST_BASE : LIVE_BASE;
}

function secretKey(env: BapiEnvironment): string {
  if (env === "test") {
    const k = process.env.BAPI_TEST_SECRET_KEY || process.env.BAPI_SECRET_KEY;
    if (!k) throw new Error("BAPI_TEST_SECRET_KEY is not configured");
    return k;
  }
  const k = process.env.BAPI_SECRET_KEY;
  if (!k) throw new Error("BAPI_SECRET_KEY is not configured");
  return k;
}

/**
 * Website demos (milypay.xyz) use sandbox. Paid API host (api.milypay.xyz) uses live.
 */
export function bapiEnvFromRequest(req: Request): BapiEnvironment {
  const host = (req.headers.get("host") || "").toLowerCase();
  if (host.startsWith("api.")) return "live";
  // Local dev / preview / marketing site: sandbox for demos.
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("workers.dev")) {
    return "test";
  }
  // milypay.xyz, www.milypay.xyz, and any non-api host
  if (!host.startsWith("api.")) return "test";
  return "live";
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

  get needsPaymentMethod(): boolean {
    return this.status === 402 || this.code === "payment_method_required";
  }
}

async function bapiFetch<T = unknown>(
  path: string,
  init: RequestInit & {
    query?: Record<string, string | undefined>;
    raw?: boolean;
    environment?: BapiEnvironment;
  } = {},
): Promise<T> {
  const env = resolveEnv({ environment: init.environment });
  const url = new URL(`${baseUrl(env)}${path.startsWith("/") ? path : `/${path}`}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const { query: _q, raw, environment: _e, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${secretKey(env)}`);
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

  if (!res.ok) {
    const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
    const code = typeof rec?.error === "string" ? rec.error : null;
    let message =
      (typeof rec?.message === "string" && rec.message) ||
      (typeof rec?.error === "string" && rec.error) ||
      `Business API upstream ${res.status}`;
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

export async function orderCompanyExtract(
  acn: string,
  extractType: string = "current",
  opts?: BapiCallOptions,
): Promise<ExtractOrderResult> {
  const clean = cleanAcn(acn);
  if (!clean) throw new BusinessApiError(400, "ACN must be up to 9 digits");
  const type = normalizeExtractType(extractType);
  const environment = resolveEnv(opts);

  const raw = await bapiFetch<Record<string, unknown>>("/asic/extracts", {
    method: "POST",
    environment,
    body: JSON.stringify({
      generalInformation: { acn: clean, type },
    }),
  });

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

export async function getExtractStatus(
  requestId: string | number,
  opts?: BapiCallOptions,
): Promise<ExtractStatus> {
  const environment = resolveEnv(opts);
  const raw = await bapiFetch<Record<string, unknown>>(`/asic/extracts/${requestId}`, {
    method: "GET",
    environment,
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

export async function getExtractPdf(
  requestId: string | number,
  opts?: BapiCallOptions,
): Promise<ArrayBuffer> {
  return bapiFetch<ArrayBuffer>(`/asic/extracts/${requestId}/pdf`, {
    method: "GET",
    raw: true,
    environment: resolveEnv(opts),
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

export async function orderAndFetchExtract(
  acn: string,
  extractType: string = "current",
  opts: BapiCallOptions & { waitMs?: number; pollMs?: number } = {},
): Promise<{
  acn: string;
  type: ExtractType;
  requestId: number | string;
  status: string;
  documentNumber?: string | null;
  pdfBase64?: string;
  pdfBytes?: number;
  environment: BapiEnvironment;
  demo: boolean;
}> {
  const type = normalizeExtractType(extractType);
  const environment = resolveEnv(opts);
  const callOpts: BapiCallOptions = { environment };
  const order = await orderCompanyExtract(acn, type, callOpts);
  const waitMs = opts.waitMs ?? 8000;
  const pollMs = opts.pollMs ?? 1000;
  const deadline = Date.now() + waitMs;

  let status = order.status;
  let documentNumber: string | null | undefined = null;

  while (Date.now() < deadline) {
    const st = await getExtractStatus(order.requestId, callOpts);
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
    environment: BapiEnvironment;
    demo: boolean;
  } = {
    acn: order.acn || cleanAcn(acn) || acn,
    type,
    requestId: order.requestId,
    status,
    documentNumber,
    environment,
    demo: environment === "test",
  };

  if (/finish|complete|done|ready/i.test(status)) {
    try {
      const pdf = await getExtractPdf(order.requestId, callOpts);
      result.pdfBase64 = bufToBase64(pdf);
      result.pdfBytes = pdf.byteLength;
    } catch {
      // Status finished but PDF not yet available.
    }
  }

  return result;
}

export async function accountStatus(opts?: BapiCallOptions): Promise<unknown> {
  return bapiFetch("/account-status", { method: "GET", environment: resolveEnv(opts) });
}

export async function businessApiReadiness(opts?: BapiCallOptions): Promise<{
  configured: boolean;
  paidOk: boolean;
  environment: BapiEnvironment;
  message: string;
}> {
  const environment = resolveEnv(opts);
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
    await accountStatus({ environment });
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
