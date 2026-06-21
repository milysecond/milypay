// BSB (Bank-State-Branch) directory lookup, stored in Turso (libSQL).
// Source: AusPayNet BSB Directory (https://auspaynet.com.au/BSBLinks).
// Updated on the first NSW business day of each month via keepwarm/seed-bsb.js.
// Config (Worker env): TURSO_BSB_URL, TURSO_BSB_AUTH_TOKEN.
//
// Note: AusPayNet API terms prohibit redistribution without written consent.
// Data is served from the publicly downloadable bulk CSV (no auth required).
// Contact operations@auspaynet.com.au to formalise a commercial redistribution
// agreement before going to high volume.

import { tursoQuery } from "./turso";

function query<T = Record<string, unknown>>(sql: string, args: (string | number)[]): Promise<T[]> {
  return tursoQuery<T>(process.env.TURSO_BSB_URL, process.env.TURSO_BSB_AUTH_TOKEN, sql, args);
}

// Accept "012-002", "012002", "012 002" — always store/return with hyphen.
export function normaliseBsb(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 6) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

const SERVICE_LABELS: Record<string, string> = {
  P: "Paper (cheques, APCS)",
  E: "Electronic (direct entry)",
  H: "High value (HVCS, same-day large payments)",
};

function parseServices(s: string | null): string[] {
  if (!s) return [];
  return s.split("").filter((c) => SERVICE_LABELS[c]).map((c) => SERVICE_LABELS[c]);
}

// A merged/closed BSB points to another BSB. Parse "Merged" / "Refer to BSB NNN-NNN".
function parseMerge(branch: string): string | null {
  const m = branch.match(/(?:refer to bsb|merged.*?bsb)\s*(\d{3}-\d{3}|\d{6})/i);
  if (!m) return null;
  return normaliseBsb(m[1]);
}

interface Row {
  bsb: string;
  bank: string;
  bank_name: string | null;
  branch: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  services: string | null;
}

export interface BsbEntry {
  bsb: string;
  bank: string;
  bankName: string | null;
  branch: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  services: string[];
  merged: boolean;
  mergedTo: string | null;
}

function shape(r: Row): BsbEntry {
  const merged = /^merged/i.test(r.branch);
  return {
    bsb: r.bsb,
    bank: r.bank,
    bankName: r.bank_name || null,
    branch: r.branch,
    address: r.address || null,
    suburb: r.suburb || null,
    state: r.state || null,
    postcode: r.postcode || null,
    services: parseServices(r.services),
    merged,
    mergedTo: merged ? parseMerge(r.branch) : null,
  };
}

export async function lookupBsb(raw: string): Promise<BsbEntry | { error: string }> {
  const bsb = normaliseBsb(raw);
  if (!bsb) return { error: "BSB must be 6 digits, e.g. 012-002 or 012002" };
  const rows = await query<Row>(
    `SELECT bsb, bank, bank_name, branch, address, suburb, state, postcode, services
     FROM bsb WHERE bsb = ? LIMIT 1`,
    [bsb],
  );
  if (rows.length === 0) return { error: "BSB not found" };
  return shape(rows[0]);
}

export async function searchBsb(
  q: string,
  limit = 10,
): Promise<{ results: BsbEntry[] } | { error: string }> {
  if (!q || q.trim().length < 2) return { error: "q must be at least 2 characters" };
  const want = Math.min(Math.max(limit, 1), 20);
  const like = `%${q.trim().replace(/%/g, "").replace(/_/g, "")}%`;
  const rows = await query<Row>(
    `SELECT bsb, bank, bank_name, branch, address, suburb, state, postcode, services
     FROM bsb
     WHERE bank_name LIKE ? OR branch LIKE ? OR suburb LIKE ? OR bank LIKE ?
     ORDER BY
       CASE WHEN bank_name LIKE ? THEN 0 ELSE 1 END,
       suburb
     LIMIT ?`,
    [like, like, like, like, like, want],
  );
  return { results: rows.map(shape) };
}
