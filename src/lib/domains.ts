/**
 * Domain check / quote / register via Dynadot API3.
 * Merchant-of-record model: agent pays Milypay (x402); we register on Dynadot.
 *
 * Env:
 *   DYNADOT_API_KEY
 *   DOMAIN_MARKUP_USD   fixed USD markup on top of registrar (default "3.00")
 *   DOMAIN_MIN_PRICE    floor human price (default "5.00")
 *
 * Allowlisted TLDs only. No premium domains in v1. No transfers/DNS hosting.
 */

const BASE = "https://api.dynadot.com/api3.json";

/** Safe default TLDs for agent registration v1 */
export const ALLOWED_TLDS = new Set([
  "com",
  "net",
  "org",
  "xyz",
  "ai",
  "io",
  "app",
  "dev",
  "info",
  "co",
  "me",
  "online",
  "site",
  "store",
  "tech",
]);

const UA = "Milypay/1.0 (+https://milypay.xyz; Dynadot domain proxy)";

function apiKey(): string {
  const k = process.env.DYNADOT_API_KEY?.trim();
  if (!k) {
    throw Object.assign(new Error("Dynadot API not configured"), {
      code: "not_configured",
      status: 503,
    });
  }
  return k;
}

export function domainsConfigured(): boolean {
  return Boolean(process.env.DYNADOT_API_KEY?.trim());
}

function markupUsd(): number {
  const n = Number(process.env.DOMAIN_MARKUP_USD || "3.00");
  return Number.isFinite(n) && n >= 0 ? n : 3;
}

function minPriceUsd(): number {
  const n = Number(process.env.DOMAIN_MIN_PRICE || "5.00");
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

export function listDomainProducts() {
  return {
    brand: "Milypay",
    service: "domains",
    mode: "register_proxy",
    note: "Check availability, quote, and register DNS domains via x402. Milypay is merchant of record (Dynadot backend). No premium names, no transfers in v1.",
    configured: domainsConfigured(),
    allowedTlds: [...ALLOWED_TLDS].sort(),
    markupUsd: markupUsd(),
    minPriceUsd: minPriceUsd(),
    endpoints: [
      { path: "/domains", method: "GET", price: "0.001", description: "Catalogue" },
      {
        path: "/domains/check?name=example.com",
        method: "GET",
        price: "0.01",
        description: "Availability + registrar cost",
      },
      {
        path: "/domains/quote?name=example.com&years=1",
        method: "GET",
        price: "0.01",
        description: "Agent checkout price (cost + markup)",
      },
      {
        path: "/domains/register",
        method: "POST",
        price: "variable",
        description: "Register after x402 payment for quote amount. Body: {name, years?}",
      },
    ],
    docs: "https://milypay.xyz/agents.md",
    upstream: "Dynadot API3",
  };
}

async function dynadot(params: Record<string, string>): Promise<unknown> {
  const key = apiKey();
  const url = new URL(BASE);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { accept: "application/json", "user-agent": UA },
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`Dynadot bad JSON HTTP ${res.status}`), {
      code: "dynadot_error",
      status: 502,
    });
  }
  if (!res.ok) {
    throw Object.assign(new Error(`Dynadot HTTP ${res.status}`), {
      code: "dynadot_error",
      status: 502,
      upstream: json,
    });
  }
  return json;
}

export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
  d = d.replace(/^www\./, "");
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(d)) {
    throw Object.assign(new Error("Invalid domain name"), { code: "bad_request", status: 400 });
  }
  const labels = d.split(".");
  if (labels.length < 2 || labels.some((l) => l.length === 0)) {
    throw Object.assign(new Error("Invalid domain name"), { code: "bad_request", status: 400 });
  }
  // only 2-label names in v1 (example.com) — no co.uk complexity
  if (labels.length !== 2) {
    throw Object.assign(new Error("Only second-level domains supported in v1 (e.g. example.com)"), {
      code: "bad_request",
      status: 400,
    });
  }
  const tld = labels[1]!;
  if (!ALLOWED_TLDS.has(tld)) {
    throw Object.assign(new Error(`TLD .${tld} not allowed. Allowed: ${[...ALLOWED_TLDS].sort().join(", ")}`), {
      code: "tld_not_allowed",
      status: 400,
    });
  }
  return d;
}

function parsePriceBlob(priceStr: string | undefined): {
  registerUsd: number | null;
  renewUsd: number | null;
  premium: boolean;
  raw?: string;
} {
  if (!priceStr) return { registerUsd: null, renewUsd: null, premium: false };
  const premium = /premium\s+domain/i.test(priceStr) && !/not a premium/i.test(priceStr);
  const reg = priceStr.match(/Registration Price:\s*([\d.]+)\s*in\s*USD/i);
  const ren = priceStr.match(/Renewal price:\s*([\d.]+)\s*in\s*USD/i);
  return {
    registerUsd: reg ? Number(reg[1]) : null,
    renewUsd: ren ? Number(ren[1]) : null,
    premium,
    raw: priceStr,
  };
}

export type DomainCheck = {
  brand: "Milypay";
  service: "domains/check";
  name: string;
  tld: string;
  available: boolean;
  premium: boolean;
  registrarRegisterUsd: number | null;
  registrarRenewUsd: number | null;
  agentPriceUsd: number | null;
  yearsDefault: number;
  currency: "USD";
  canRegister: boolean;
  reason?: string;
  fetchedAt: string;
};

function agentPrice(registerUsd: number | null): number | null {
  if (registerUsd == null || !Number.isFinite(registerUsd)) return null;
  const p = Math.max(registerUsd + markupUsd(), minPriceUsd());
  // 2 decimal USD
  return Math.round(p * 100) / 100;
}

export async function checkDomain(nameInput: string): Promise<DomainCheck> {
  const name = normalizeDomain(nameInput);
  const tld = name.split(".")[1]!;
  const raw = (await dynadot({
    command: "search",
    domain0: name,
    show_price: "1",
    currency: "USD",
  })) as {
    SearchResponse?: {
      ResponseCode?: string | number;
      SearchResults?: Array<{
        DomainName?: string;
        Available?: string;
        Status?: string;
        Price?: string;
      }>;
      Error?: string;
    };
  };
  const sr = raw.SearchResponse;
  if (!sr || String(sr.ResponseCode) === "-1") {
    throw Object.assign(new Error(sr?.Error || "Dynadot search failed"), {
      code: "dynadot_error",
      status: 502,
    });
  }
  const hit = (sr.SearchResults || [])[0];
  const available = (hit?.Available || "").toLowerCase() === "yes";
  const parsed = parsePriceBlob(hit?.Price);
  const price = agentPrice(parsed.registerUsd);
  let canRegister = available && !parsed.premium && price != null;
  let reason: string | undefined;
  if (!available) reason = "unavailable";
  else if (parsed.premium) {
    canRegister = false;
    reason = "premium_not_supported_v1";
  } else if (price == null) {
    canRegister = false;
    reason = "price_unavailable";
  }

  return {
    brand: "Milypay",
    service: "domains/check",
    name,
    tld,
    available,
    premium: parsed.premium,
    registrarRegisterUsd: parsed.registerUsd,
    registrarRenewUsd: parsed.renewUsd,
    agentPriceUsd: price,
    yearsDefault: 1,
    currency: "USD",
    canRegister,
    reason,
    fetchedAt: new Date().toISOString(),
  };
}

export type DomainQuote = Omit<DomainCheck, "service"> & {
  service: "domains/quote";
  years: number;
  /** Human amount string for x402 gate */
  chargeUsd: string;
  markupUsd: number;
};

export async function quoteDomain(nameInput: string, years = 1): Promise<DomainQuote> {
  const y = Math.min(10, Math.max(1, Math.floor(years || 1)));
  const check = await checkDomain(nameInput);
  // Dynadot multi-year often years * register; use that for charge
  const base = check.registrarRegisterUsd;
  const multi = base != null ? base * y : null;
  const charge = agentPrice(multi);
  return {
    ...check,
    service: "domains/quote",
    years: y,
    registrarRegisterUsd: multi ?? check.registrarRegisterUsd,
    agentPriceUsd: charge,
    chargeUsd: charge != null ? charge.toFixed(2) : "0",
    markupUsd: markupUsd(),
    canRegister: check.canRegister && charge != null,
    reason: check.canRegister ? check.reason : check.reason || "cannot_register",
  };
}

export type RegisterResult = {
  brand: "Milypay";
  service: "domains/register";
  name: string;
  years: number;
  status: string;
  responseCode?: string | number;
  success: boolean;
  message?: string;
  registrar: "dynadot";
  chargedUsd?: string;
  fetchedAt: string;
};

/**
 * Attempt registration. Caller must have collected x402 payment for quote.chargeUsd.
 * Fails closed on premium / unavailable / bad TLD.
 */
export async function registerDomain(nameInput: string, years = 1): Promise<RegisterResult> {
  const quote = await quoteDomain(nameInput, years);
  if (!quote.canRegister || !quote.available) {
    throw Object.assign(new Error(quote.reason || "Domain cannot be registered"), {
      code: quote.reason || "cannot_register",
      status: 400,
      quote,
    });
  }

  const raw = (await dynadot({
    command: "register",
    domain: quote.name,
    duration: String(quote.years),
    currency: "USD",
  })) as {
    RegisterResponse?: {
      ResponseCode?: string | number;
      Status?: string;
      DomainName?: string;
      Error?: string;
      Message?: string;
    };
  };
  const rr = raw.RegisterResponse || {};
  const status = String(rr.Status || rr.Error || "unknown").toLowerCase();
  const code = rr.ResponseCode;
  // success codes: 0 / success
  const success =
    status === "success" ||
    String(code) === "0" ||
    status.includes("registered") ||
    status === "ok";

  return {
    brand: "Milypay",
    service: "domains/register",
    name: quote.name,
    years: quote.years,
    status: rr.Status || rr.Error || "unknown",
    responseCode: code,
    success,
    message: rr.Message || rr.Error,
    registrar: "dynadot",
    chargedUsd: quote.chargeUsd,
    fetchedAt: new Date().toISOString(),
  };
}

export function errorToResponse(e: unknown): { status: number; body: Record<string, unknown> } {
  const err = e as {
    message?: string;
    code?: string;
    status?: number;
    quote?: unknown;
    upstream?: unknown;
  };
  const status = typeof err.status === "number" ? err.status : 500;
  return {
    status,
    body: {
      error: err.message || "Domain error",
      code: err.code || "domain_error",
      brand: "Milypay",
      configured: domainsConfigured(),
      quote: err.quote,
      setup:
        err.code === "not_configured"
          ? "Set Worker secret DYNADOT_API_KEY"
          : undefined,
    },
  };
}
