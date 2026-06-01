// ABR (Australian Business Register) ABN Lookup client.
// Uses the GUID-authenticated JSON endpoints, which are simple to call from a Worker.
// Register for a free GUID at https://abr.business.gov.au/Tools/WebServices
// GUID is read from the ABR_GUID environment variable (Worker secret).

const ABR_BASE = "https://abr.business.gov.au/json";

function guid(): string {
  const g = process.env.ABR_GUID;
  if (!g) throw new Error("ABR_GUID is not configured");
  return g;
}

// The ABR JSON endpoints return JSONP: `callback({...})`. Strip the wrapper.
function parseJsonp<T>(text: string): T {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  if (start === -1 || end === -1) throw new Error("Unexpected ABR response");
  return JSON.parse(text.slice(start + 1, end)) as T;
}

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${ABR_BASE}/${path}`);
  url.searchParams.set("callback", "cb");
  url.searchParams.set("guid", guid());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/javascript, application/json, */*" },
  });
  if (!res.ok) throw new Error(`ABR upstream ${res.status}`);
  return parseJsonp<T>(await res.text());
}

// ---- Raw upstream shapes (subset; verified/extended against live responses) ----

interface AbrAbnRaw {
  Abn?: string;
  AbnStatus?: string;
  AbnStatusEffectiveFrom?: string;
  Acn?: string;
  AddressDate?: string;
  AddressPostcode?: string;
  AddressState?: string;
  BusinessName?: string[];
  EntityName?: string;
  EntityTypeCode?: string;
  EntityTypeName?: string;
  Gst?: string;
  Message?: string;
}

interface AbrNameMatch {
  Abn?: string;
  AbnStatus?: string;
  Name?: string;
  NameType?: string;
  Postcode?: string;
  State?: string;
  Score?: number;
}

interface AbrNamesRaw {
  Names?: AbrNameMatch[];
  Message?: string;
}

// MatchingNames returns AbnStatus as a numeric code rather than a label.
function mapNameStatus(code: string | undefined): string | null {
  if (!code) return null;
  const n = code.replace(/^0+/, "") || "0";
  if (n === "1") return "Active";
  if (n === "2") return "Cancelled";
  return code;
}

// ---- Normalised, agent-friendly output ----

export interface AbnRecord {
  abn: string;
  abnStatus: string;
  abnStatusFrom: string | null;
  acn: string | null;
  entityName: string | null;
  entityType: string | null;
  businessNames: string[];
  gstRegistered: boolean;
  gstFrom: string | null;
  state: string | null;
  postcode: string | null;
}

function normaliseAbn(r: AbrAbnRaw): AbnRecord {
  return {
    abn: (r.Abn || "").trim(),
    abnStatus: r.AbnStatus || "Unknown",
    abnStatusFrom: r.AbnStatusEffectiveFrom || null,
    acn: r.Acn ? r.Acn.trim() : null,
    entityName: r.EntityName || null,
    entityType: r.EntityTypeName || null,
    businessNames: Array.isArray(r.BusinessName) ? r.BusinessName.filter(Boolean) : [],
    gstRegistered: Boolean(r.Gst),
    gstFrom: r.Gst || null,
    state: r.AddressState || null,
    postcode: r.AddressPostcode || null,
  };
}

export async function lookupAbn(abn: string): Promise<AbnRecord | { error: string }> {
  const clean = abn.replace(/\s+/g, "");
  if (!/^\d{11}$/.test(clean)) return { error: "ABN must be 11 digits" };
  const raw = await call<AbrAbnRaw>("AbnDetails.aspx", { abn: clean });
  if (raw.Message) return { error: raw.Message };
  if (!raw.Abn) return { error: "ABN not found" };
  return normaliseAbn(raw);
}

export async function lookupAcn(acn: string): Promise<AbnRecord | { error: string }> {
  const clean = acn.replace(/\s+/g, "");
  if (!/^\d{9}$/.test(clean)) return { error: "ACN must be 9 digits" };
  const raw = await call<AbrAbnRaw>("AcnDetails.aspx", { acn: clean });
  if (raw.Message) return { error: raw.Message };
  if (!raw.Abn) return { error: "ACN not found" };
  return normaliseAbn(raw);
}

export interface NameMatch {
  abn: string;
  name: string;
  nameType: string | null;
  abnStatus: string | null;
  state: string | null;
  postcode: string | null;
  score: number | null;
}

export async function searchByName(
  name: string,
  maxResults = 10,
): Promise<{ matches: NameMatch[] } | { error: string }> {
  if (!name || name.trim().length < 2) return { error: "name must be at least 2 characters" };
  const raw = await call<AbrNamesRaw>("MatchingNames.aspx", {
    name: name.trim(),
    maxResults: String(Math.min(Math.max(maxResults, 1), 50)),
  });
  if (raw.Message) return { error: raw.Message };
  const matches = (raw.Names || []).map((m) => ({
    abn: (m.Abn || "").trim(),
    name: m.Name || "",
    nameType: m.NameType || null,
    abnStatus: mapNameStatus(m.AbnStatus),
    state: m.State || null,
    postcode: m.Postcode || null,
    score: typeof m.Score === "number" ? m.Score : null,
  }));
  return { matches };
}
