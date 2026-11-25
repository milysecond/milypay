// Acceleon ASIC Web API v4.4 (V2) — UAT test mode.
//
// Acceleon whitelists source IPs, so the Worker never calls Acceleon directly.
// Calls go to a small relay (Sal's Mac, whitelisted) exposed through a Cloudflare
// named tunnel. The relay holds the Acceleon login, forwards an allowlist of V2
// calls, and talks to UAT ONLY. Worker secrets:
//   ACCELEON_RELAY_URL    e.g. https://acceleon-relay.milypay.xyz
//   ACCELEON_RELAY_KEY    shared secret sent as X-Relay-Key
//   ACCELEON_TOKEN_SECRET HMAC key for buyer download tokens (falls back to relay key)
//
// UAT returns dummy extract content ("SAMPLE ORGANISATION NAME"). Not real ASIC data.

import { NextResponse } from "next/server";

export const ACCELEON_ENV = "UAT" as const;
export const UAT_NOTICE =
  "TEST MODE: Acceleon UAT. Search and details reflect the ASIC register, but extract contents are dummy test data (e.g. 'SAMPLE ORGANISATION NAME'). Not a live ASIC extract.";
export const ATTRIBUTION = "Source: ASIC via Acceleon ASIC Web API (UAT test environment)";

/** Test-mode x402 prices (USD-equivalent stables). Intended prod pricing must exceed
 * Acceleon's A$12 (current) / A$23 (current + historical) cost. */
export const PRICES = {
  search: "0.005",
  details: "0.005",
  purchaseCurrent: "0.10",
  purchaseHistorical: "0.20",
} as const;

export const TOKEN_TTL_SECONDS = 30 * 24 * 3600;

export type OrgKind = "company" | "business";

export class RelayError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
  }
}

function relayConfig() {
  const url = (process.env.ACCELEON_RELAY_URL || "").replace(/\/$/, "");
  const key = process.env.ACCELEON_RELAY_KEY || "";
  if (!url || !key) throw new RelayError("ACCELEON_RELAY_URL / ACCELEON_RELAY_KEY not configured", 503);
  return { url, key };
}

export function isSafeNni(nni: string): boolean {
  return /^[A-Za-z0-9]{1,32}$/.test(nni);
}

export function normalizeNni(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

export function isSafeExtractId(id: string): boolean {
  return /^\d{1,18}$/.test(id);
}

type RelayResult = { status: number; text: string; json: unknown };

async function relay(method: "GET" | "POST", path: string, body?: unknown): Promise<RelayResult> {
  const { url, key } = relayConfig();
  let res: Response;
  try {
    res = await fetch(url + path, {
      method,
      headers: {
        "X-Relay-Key": key,
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    throw new RelayError(`Relay unreachable: ${e instanceof Error ? e.message : "error"}`, 502);
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  // Cloudflare tunnel down / relay offline
  if ([502, 503, 504, 530].includes(res.status) && json === null) {
    throw new RelayError("ASIC relay is offline (test environment). Try again later.", 503);
  }
  if (res.status === 401 && json && typeof json === "object" && (json as { error?: string }).error === "unauthorized") {
    throw new RelayError("Relay authentication failed", 503);
  }
  return { status: res.status, text, json };
}

function upstreamMessage(r: RelayResult): string {
  if (r.json && typeof r.json === "object") {
    const o = r.json as Record<string, unknown>;
    for (const k of ["Message", "message", "error_description", "error"]) {
      if (typeof o[k] === "string" && o[k]) return o[k] as string;
    }
  }
  return r.text.slice(0, 200) || `Upstream status ${r.status}`;
}

function ensureOk(r: RelayResult, what: string) {
  if (r.status >= 200 && r.status < 300) return;
  if (r.status === 404) throw new RelayError(`${what}: not found`, 404, r.json);
  if (r.status === 400) throw new RelayError(`${what}: ${upstreamMessage(r)}`, 400, r.json);
  throw new RelayError(`${what}: ${upstreamMessage(r)}`, 502, r.json);
}

export async function searchOrganisations(name: string) {
  const r = await relay("GET", `/v2/Organisation?name=${encodeURIComponent(name)}`);
  ensureOk(r, "Search");
  return r.json;
}

export async function organisationDetails(kind: OrgKind, nni: string) {
  const seg = kind === "business" ? "Business" : "Company";
  const r = await relay("GET", `/v2/Organisation/${seg}/${encodeURIComponent(nni)}`);
  ensureOk(r, "Details");
  return r.json;
}

/** UAT replies with a bare number (e.g. 97128); docs say {"ExtractID": n}. Handle both. */
export function parseExtractId(text: string, json: unknown): string | null {
  const bare = text.trim().replace(/^"|"$/g, "");
  if (/^\d{1,18}$/.test(bare)) return bare;
  if (typeof json === "number") return String(json);
  const walk = (o: unknown, depth: number): string | null => {
    if (!o || typeof o !== "object" || depth > 3) return null;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (/^extract.?id$/i.test(k) || /^id$/i.test(k)) {
        if (typeof v === "number") return String(v);
        if (typeof v === "string" && /^\d{1,18}$/.test(v)) return v;
      }
    }
    for (const v of Object.values(o as Record<string, unknown>)) {
      const f = walk(v, depth + 1);
      if (f) return f;
    }
    return null;
  };
  return walk(json, 0);
}

export async function purchaseExtract(kind: OrgKind, nni: string, isCurrent: boolean, notes: string) {
  const seg = kind === "business" ? "Business" : "Company";
  const r = await relay("POST", `/v2/Organisation/${seg}/${encodeURIComponent(nni)}`, {
    Notes: notes.slice(0, 200),
    IsCurrent: isCurrent,
  });
  if (r.status === 402) {
    throw new RelayError("Upstream Acceleon account cannot fund this extract", 503, r.json);
  }
  ensureOk(r, "Purchase");
  const id = parseExtractId(r.text, r.json);
  if (!id) throw new RelayError("Purchase accepted but no extract ID returned", 502, r.text.slice(0, 200));
  return id;
}

export async function extractStatus(id: string): Promise<string> {
  const r = await relay("GET", `/v2/Extract/Status/${id}`);
  ensureOk(r, "Status");
  const j = r.json;
  if (j && typeof j === "object" && typeof (j as { Status?: unknown }).Status === "string") {
    return (j as { Status: string }).Status;
  }
  if (typeof j === "string") return j;
  return r.text.trim().replace(/^"|"$/g, "") || "Unknown";
}

function maybeJson(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

export async function downloadExtract(id: string, includePdf: boolean) {
  const r = await relay("GET", `/v2/Extract/${id}?includePDF=${includePdf ? "true" : "false"}`);
  ensureOk(r, "Download");
  const j = (r.json && typeof r.json === "object" ? r.json : {}) as Record<string, unknown>;
  const pdf = typeof j.PDFData === "string" && j.PDFData.length > 0 ? j.PDFData : null;
  return {
    extractType: j.ExtractType ?? null,
    extractDate: j.ExtractDate ?? null,
    data: maybeJson(j.JSONData),
    fullData: maybeJson(j.FullJSONData),
    pdfBase64: pdf,
  };
}

// ---------- buyer tokens (HMAC-SHA256) ----------

type TokenPayload = { x: string; k: OrgKind; n: string; e: number };

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.ACCELEON_TOKEN_SECRET || process.env.ACCELEON_RELAY_KEY || "";
  if (!secret) throw new RelayError("Token secret not configured", 503);
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`milypay-asic-extract:v1:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signExtractToken(id: string, kind: OrgKind, nni: string) {
  const payload: TokenPayload = { x: id, k: kind, n: nni, e: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(body)));
  return { token: `${body}.${b64url(sig)}`, expiresAt: new Date(payload.e * 1000).toISOString() };
}

export async function verifyExtractToken(token: string, id: string): Promise<TokenPayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      b64urlDecode(sig) as BufferSource,
      new TextEncoder().encode(body),
    );
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as TokenPayload;
    if (p.x !== id || p.e < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

export function tokenFromRequest(req: Request): string {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  return (
    url.searchParams.get("token") ||
    req.headers.get("x-extract-token") ||
    (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "")
  ).trim();
}

export function relayFail(e: unknown) {
  if (e instanceof RelayError) {
    const status = e.status === 404 || e.status === 400 ? e.status : e.status === 503 ? 503 : 502;
    return NextResponse.json(
      { error: e.message, environment: ACCELEON_ENV, brand: "Milypay" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error("acceleon error", e instanceof Error ? e.message : "error");
  return NextResponse.json({ error: "ASIC extract service error", environment: ACCELEON_ENV }, { status: 502 });
}

export function okJson(body: Record<string, unknown>, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { ...body, environment: ACCELEON_ENV, testMode: true, notice: UAT_NOTICE, attribution: ATTRIBUTION },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "x-data-source": ATTRIBUTION,
        "x-acceleon-environment": ACCELEON_ENV,
        ...extraHeaders,
      },
    },
  );
}
