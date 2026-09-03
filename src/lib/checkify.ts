/**
 * Checkify (checkify.com.au) — AU/NZ address extras + name availability +
 * sanctions + checksums. Private token server-side only.
 *
 * Env: CHECKIFY_API_KEY (ck_prv_…)
 * Base: https://checkify.com.au/api/v1
 */

const BASE = "https://checkify.com.au/api/v1";

export function checkifyConfigured(): boolean {
  return Boolean(process.env.CHECKIFY_API_KEY?.trim());
}

export class CheckifyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "CheckifyError";
  }
}

async function ckGet(path: string, qs: Record<string, string | number | undefined>) {
  const key = process.env.CHECKIFY_API_KEY?.trim();
  if (!key) throw new CheckifyError(503, "Checkify not configured");
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(qs)) {
    if (v === undefined || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "user-agent": "milypay/checkify",
    },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : `Checkify ${res.status}`;
    throw new CheckifyError(res.status, msg);
  }
  return body;
}

export function checkifyCatalogue() {
  return {
    brand: "Milypay",
    provider: "Checkify",
    docs: "https://checkify.com.au/developers",
    configured: checkifyConfigured(),
    note: "x402 wrapper. Checkify units billed to Milypay. TFN/Director ID are checksums only — not live registry lookups.",
    endpoints: [
      { path: "/au-check/postcode", price: "0.01", desc: "Suburbs in a postcode (AU/NZ)" },
      { path: "/au-check/reverse", price: "0.01", desc: "Reverse geocode lat/lng → nearest address" },
      { path: "/au-check/suburb", price: "0.005", desc: "Suburb / locality autocomplete" },
      { path: "/au-check/activity", price: "0.005", desc: "ANZSIC / business activity search" },
      { path: "/au-check/company-name", price: "0.01", desc: "ASIC company name availability" },
      { path: "/au-check/business-name", price: "0.01", desc: "ASIC business name availability" },
      { path: "/au-check/sanctions", price: "0.03", desc: "Sanctions screening (11 lists)" },
      { path: "/au-check/director-id", price: "0.01", desc: "Director ID checksum (not live ABRS)" },
      { path: "/au-check/tfn", price: "0.01", desc: "TFN checksum (not live ATO)" },
      { path: "/au-check/email", price: "0.01", desc: "Email format/MX/deliverability" },
    ],
  };
}

export const postcodeLookup = (postcode: string, country = "au") =>
  ckGet("/postcode", { postcode, country });

export const reverseGeocode = (
  lat: string,
  lng: string,
  radius?: string,
  limit?: string,
  country = "au",
) => ckGet("/reverse", { lat, lng, radius, limit, country });

export const suburbSearch = (query: string, country = "au") =>
  ckGet("/autocomplete-suburb", { query, country });

export const activitySearch = (search: string, limit?: string) =>
  ckGet("/business-activity", { search, limit });

export const companyNameCheck = (name: string) => ckGet("/company-name", { name });

export const businessNameCheck = (name: string) => ckGet("/business-name", { name });

export const sanctionsScreen = (opts: {
  name: string;
  birth_year?: string;
  country?: string;
  city?: string;
}) => ckGet("/sanctions-screening", opts);

export const directorIdCheck = (director_id: string) =>
  ckGet("/director-id", { director_id });

export const tfnCheck = (tfn: string) => ckGet("/tfn", { tfn });

export const emailCheck = (email: string) => ckGet("/email", { email });
