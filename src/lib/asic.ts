// ASIC company register lookup, stored in Turso (libSQL).
// Data: ASIC Company Dataset (open, data.gov.au), refreshed weekly by ASIC.
// Config (Worker env): TURSO_ASIC_URL, TURSO_ASIC_AUTH_TOKEN.

import { tursoQuery } from "./turso";

function query<T = Record<string, unknown>>(sql: string, args: (string | number)[]): Promise<T[]> {
  return tursoQuery<T>(process.env.TURSO_ASIC_URL, process.env.TURSO_ASIC_AUTH_TOKEN, sql, args);
}

const STATUS: Record<string, string> = {
  REGD: "Registered",
  DRGD: "Deregistered",
  EXAD: "External administration or strike-off in progress",
  SOFF: "Strike-off in progress",
  PEND: "Pending",
  DISS: "Dissolved",
  NOCP: "Not currently in operation",
};
const TYPE: Record<string, string> = {
  APTY: "Australian proprietary company",
  APUB: "Australian public company",
};
const CLASS: Record<string, string> = {
  LMSH: "Limited by shares",
  LMGT: "Limited by guarantee",
  LMSG: "Limited by shares and guarantee",
  NLIA: "No liability",
  ULSH: "Unlimited with share capital",
};

function isoDate(d: string | null): string | null {
  if (!d) return null;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

interface Row {
  name: string;
  acn: string;
  abn: string | null;
  status: string;
  type: string | null;
  class: string | null;
  subclass: string | null;
  reg_date: string | null;
  dereg_date: string | null;
  prev_state: string | null;
  current_ind: string | null;
}

export interface Company {
  acn: string;
  abn: string | null;
  name: string;
  status: string;
  statusCode: string;
  type: string | null;
  class: string | null;
  registrationDate: string | null;
  deregistrationDate: string | null;
  previousState: string | null;
  formerNames: string[];
}

function cleanAcn(acn: string): string | null {
  const digits = acn.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 9) return null;
  return digits.padStart(9, "0");
}

export async function lookupByAcn(acn: string): Promise<Company | { error: string }> {
  const clean = cleanAcn(acn);
  if (!clean) return { error: "ACN must be up to 9 digits" };
  const rows = await query<Row>(
    `SELECT name, acn, abn, status, type, class, subclass, reg_date, dereg_date, prev_state, current_ind
     FROM companies WHERE acn = ?`,
    [clean],
  );
  if (rows.length === 0) return { error: "Company not found" };
  const current = rows.find((r) => r.current_ind === "Y") ?? rows[0];
  const formerNames = rows
    .filter((r) => r.current_ind !== "Y" && r.name !== current.name)
    .map((r) => titleCase(r.name));
  return {
    acn: current.acn,
    abn: current.abn || null,
    name: titleCase(current.name),
    status: STATUS[current.status] ?? current.status,
    statusCode: current.status,
    type: current.type ? TYPE[current.type] ?? current.type : null,
    class: current.class ? CLASS[current.class] ?? current.class : null,
    registrationDate: isoDate(current.reg_date),
    deregistrationDate: isoDate(current.dereg_date),
    previousState: current.prev_state || null,
    formerNames: [...new Set(formerNames)],
  };
}

function ftsExpr(q: string): string {
  const tokens = q.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";
  return tokens.map((t, i) => (i === tokens.length - 1 ? `"${t}"*` : `"${t}"`)).join(" AND ");
}

export interface CompanyMatch {
  acn: string;
  name: string;
  status: string;
  formerName: boolean;
}

export async function searchByName(
  name: string,
  limit = 8,
): Promise<{ matches: CompanyMatch[] } | { error: string }> {
  if (!name || name.trim().length < 2) return { error: "name must be at least 2 characters" };
  const match = ftsExpr(name);
  if (!match) return { error: "invalid query" };
  const want = Math.min(Math.max(limit, 1), 20);
  const rows = await query<Row>(
    `SELECT c.name, c.acn, c.status, c.current_ind
     FROM companies_fts f JOIN companies c ON c.rowid = f.rowid
     WHERE f.companies_fts MATCH ? ORDER BY rank LIMIT ?`,
    [match, want * 3],
  );
  const byAcn = new Map<string, CompanyMatch>();
  for (const r of rows) {
    const existing = byAcn.get(r.acn);
    const isCurrent = r.current_ind === "Y";
    if (!existing || (isCurrent && existing.formerName)) {
      byAcn.set(r.acn, {
        acn: r.acn,
        name: titleCase(r.name),
        status: STATUS[r.status] ?? r.status,
        formerName: !isCurrent,
      });
    }
    if (byAcn.size >= want && !rows.some((x) => x.acn === r.acn && x.current_ind === "Y")) break;
  }
  return { matches: Array.from(byAcn.values()).slice(0, want) };
}
