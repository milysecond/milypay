// Business API (businessapi.com.au) client.
// Official ASIC / ATO / ABRS digital service provider. Live base: /api/v2/.
// Auth: Authorization: Bearer bapi_sk_live_* (server only) or bapi_pk_live_* (browser helpers).
//
// Config (Worker secrets / .env.local):
//   BAPI_SECRET_KEY       bapi_sk_live_... (required for server routes)
//   BAPI_PUBLISHABLE_KEY  bapi_pk_live_... (optional, helpers only)
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

// ---- Helpers (no card required on free/helper tier) ----

export interface CompanyNameAvailability {
  name: string;
  availability: string;
  shortDescription?: string;
  objections?: string[];
  existingbn?: boolean;
  /** Normalised availability flag for agents. */
  available: boolean;
  raw: unknown;
}

export async function companyNameAvailability(name: string): Promise<CompanyNameAvailability> {
  const trimmed = name.trim();
  if (trimmed.length < 1) throw new BusinessApiError(400, "name is required");

  const raw = await bapiFetch<Record<string, unknown>>("/helpers/company-name-availability", {
    method: "GET",
    query: { name: trimmed },
  });

  const availability = String(raw.availability ?? "");
  const available = /^available$/i.test(availability);

  return {
    name: String(raw.name ?? trimmed),
    availability,
    shortDescription: typeof raw.shortDescription === "string" ? raw.shortDescription : undefined,
    objections: Array.isArray(raw.objections) ? (raw.objections as string[]) : undefined,
    existingbn: typeof raw.existingbn === "boolean" ? raw.existingbn : undefined,
    available,
    raw,
  };
}

export interface BusinessNameAvailability {
  name: string;
  availability: string;
  available: boolean;
  raw: unknown;
}

export async function businessNameAvailability(
  name: string,
  state?: string,
): Promise<BusinessNameAvailability> {
  const trimmed = name.trim();
  if (trimmed.length < 1) throw new BusinessApiError(400, "name is required");

  const raw = await bapiFetch<Record<string, unknown>>("/helpers/business-name-availability", {
    method: "GET",
    query: { name: trimmed, state },
  });

  const availability = String(raw.availability ?? raw.status ?? "");
  return {
    name: String(raw.name ?? trimmed),
    availability,
    available: /^available$/i.test(availability),
    raw,
  };
}

// ---- Paid lookup (requires saved payment method on BAPI dashboard) ----

export async function lookupAcn(acn: string): Promise<unknown> {
  const digits = acn.replace(/\D/g, "").padStart(9, "0");
  if (digits.length !== 9) throw new BusinessApiError(400, "ACN must be 9 digits");
  return bapiFetch(`/lookup/acn/${digits}`, { method: "GET" });
}

export async function lookupAbn(abn: string): Promise<unknown> {
  const digits = abn.replace(/\D/g, "");
  if (digits.length !== 11) throw new BusinessApiError(400, "ABN must be 11 digits");
  return bapiFetch(`/lookup/abn/${digits}`, { method: "GET" });
}

// ---- Company extracts (POST; requires payment method + collection access) ----

export type ExtractOrderBody = {
  acn?: string;
  abn?: string;
  extractType?: string;
  [key: string]: unknown;
};

/**
 * Order an ASIC company extract via Business API.
 * Upstream: POST /api/v2/asic/extracts (secret key).
 * Exact body fields depend on your BAPI plan; common shape uses acn + optional extractType.
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
 * Lightweight readiness probe. Returns whether paid BAPI endpoints can be used.
 * Does not throw for payment_method_required.
 */
export async function businessApiReadiness(): Promise<{
  configured: boolean;
  helpersOk: boolean;
  paidOk: boolean;
  message: string;
}> {
  if (!process.env.BAPI_SECRET_KEY) {
    return {
      configured: false,
      helpersOk: false,
      paidOk: false,
      message: "BAPI_SECRET_KEY not configured",
    };
  }

  let helpersOk = false;
  try {
    await companyNameAvailability("TEST");
    helpersOk = true;
  } catch (e) {
    if (e instanceof BusinessApiError && e.status === 400) helpersOk = true;
    else {
      return {
        configured: true,
        helpersOk: false,
        paidOk: false,
        message: e instanceof Error ? e.message : "helper probe failed",
      };
    }
  }

  try {
    await accountStatus();
    return {
      configured: true,
      helpersOk,
      paidOk: true,
      message: "ok",
    };
  } catch (e) {
    if (e instanceof BusinessApiError && e.needsPaymentMethod) {
      return {
        configured: true,
        helpersOk,
        paidOk: false,
        message: "Add a saved payment method in the Business API dashboard to unlock production paid endpoints",
      };
    }
    return {
      configured: true,
      helpersOk,
      paidOk: false,
      message: e instanceof Error ? e.message : "account-status failed",
    };
  }
}
