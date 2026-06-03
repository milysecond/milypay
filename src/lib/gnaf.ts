// Australian address validation / search / geocoding over G-NAF, stored in Turso (libSQL).
// Data: Geocoded National Address File (c) Geoscape Australia, open licence.
// Talks to Turso over the libSQL HTTP pipeline API (fetch only - Workers-native, no SDK).
// Config (Worker env): TURSO_DATABASE_URL, TURSO_AUTH_TOKEN.

import { tursoQuery } from "./turso";

function query<T = Record<string, unknown>>(sql: string, args: (string | number)[]): Promise<T[]> {
  return tursoQuery<T>(process.env.TURSO_DATABASE_URL, process.env.TURSO_AUTH_TOKEN, sql, args);
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

interface Row {
  pid: string;
  unit: string | null;
  street_number: string | null;
  street: string;
  locality: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

export interface Address {
  address: string;
  gnafPid: string;
  unit: string | null;
  streetNumber: string | null;
  street: string;
  locality: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

function shape(r: Row): Address {
  const head = [
    r.unit ? `${titleCase(r.unit)}/` : "",
    r.street_number ? `${r.street_number} ` : "",
    titleCase(r.street),
  ]
    .join("")
    .trim();
  return {
    address: `${head}, ${titleCase(r.locality)} ${r.state} ${r.postcode}`,
    gnafPid: r.pid,
    unit: r.unit ? titleCase(r.unit) : null,
    streetNumber: r.street_number || null,
    street: titleCase(r.street),
    locality: titleCase(r.locality),
    state: r.state,
    postcode: r.postcode,
    lat: r.lat,
    lng: r.lng,
  };
}

// Common Australian street-type abbreviations. Expanded as ("full" OR "abbr")
// so "st" matches both "Street" and localities like "St Kilda".
const ABBREV: Record<string, string> = {
  st: "street", rd: "road", ave: "avenue", av: "avenue", dr: "drive", ct: "court",
  pl: "place", ln: "lane", cres: "crescent", cr: "crescent", pde: "parade",
  hwy: "highway", tce: "terrace", cct: "circuit", blvd: "boulevard", gve: "grove",
  cl: "close", wy: "way", sq: "square", esp: "esplanade", qy: "quay", pkwy: "parkway",
};

// FTS5 MATCH expression. Last token is prefix-matched for autocomplete; known
// street abbreviations are OR-expanded to their full form.
function ftsExpr(q: string, prefix: boolean): string {
  const tokens = q
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return "";
  return tokens
    .map((t, i) => {
      const last = prefix && i === tokens.length - 1;
      const self = last ? `"${t}"*` : `"${t}"`;
      const full = ABBREV[t];
      return full ? `("${full}" OR ${self})` : self;
    })
    .join(" AND ");
}

export async function searchAddresses(q: string, limit = 8): Promise<Address[]> {
  const match = ftsExpr(q, true);
  if (!match) return [];
  const want = Math.min(Math.max(limit, 1), 20);
  const rows = await query<Row>(
    `SELECT a.pid, a.unit, a.street_number, a.street, a.locality, a.state, a.postcode, a.lat, a.lng
     FROM addresses_fts f JOIN addresses a ON a.rowid = f.rowid
     WHERE f.addresses_fts MATCH ? ORDER BY rank LIMIT ?`,
    [match, want * 2],
  );
  const seen = new Set<string>();
  const out: Address[] = [];
  for (const r of rows.map(shape)) {
    if (seen.has(r.address)) continue;
    seen.add(r.address);
    out.push(r);
    if (out.length >= want) break;
  }
  return out;
}

export async function validateAddress(
  q: string,
): Promise<{ valid: boolean; query: string; match?: Address }> {
  const [top] = await searchAddresses(q, 1);
  return top ? { valid: true, query: q, match: top } : { valid: false, query: q };
}

export async function geocodeAddress(
  q: string,
): Promise<{ found: boolean; query: string; lat?: number | null; lng?: number | null; address?: string; gnafPid?: string }> {
  const [top] = await searchAddresses(q, 1);
  if (!top) return { found: false, query: q };
  return { found: true, query: q, lat: top.lat, lng: top.lng, address: top.address, gnafPid: top.gnafPid };
}
