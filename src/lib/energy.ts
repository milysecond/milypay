/**
 * Australian National Electricity Market (NEM) live summary.
 * Upstream: AEMO visualisations ELEC_NEM_SUMMARY (no API key).
 * https://visualisations.aemo.com.au/aemo/apps/api/report/ELEC_NEM_SUMMARY
 *
 * Regions: NSW1, QLD1, SA1, TAS1, VIC1
 */

const AEMO_SUMMARY_URL =
  "https://visualisations.aemo.com.au/aemo/apps/api/report/ELEC_NEM_SUMMARY";

const UA = "Milypay/1.0 (+https://milypay.xyz; AEMO NEM proxy)";

export const NEM_REGIONS = ["NSW1", "QLD1", "SA1", "TAS1", "VIC1"] as const;
export type NemRegion = (typeof NEM_REGIONS)[number];

export const REGION_META: Record<
  NemRegion,
  { name: string; state: string }
> = {
  NSW1: { name: "New South Wales", state: "NSW" },
  QLD1: { name: "Queensland", state: "QLD" },
  SA1: { name: "South Australia", state: "SA" },
  TAS1: { name: "Tasmania", state: "TAS" },
  VIC1: { name: "Victoria", state: "VIC" },
};

type AemoSummaryRow = {
  SETTLEMENTDATE?: string;
  REGIONID?: string;
  PRICE?: number;
  PRICE_STATUS?: string;
  APCFLAG?: number;
  MARKETSUSPENDEDFLAG?: number;
  TOTALDEMAND?: number;
  NETINTERCHANGE?: number;
  SCHEDULEDGENERATION?: number;
  SEMISCHEDULEDGENERATION?: number;
  INTERCONNECTORFLOWS?: string;
};

type AemoPriceRow = {
  REGIONID?: string;
  RRP?: number;
  RAISEREGRRP?: number;
  LOWERREGRRP?: number;
  RAISE1SECRRP?: number;
  RAISE6SECRRP?: number;
  RAISE60SECRRP?: number;
  RAISE5MINRRP?: number;
  LOWER1SECRRP?: number;
  LOWER6SECRRP?: number;
  LOWER60SECRRP?: number;
  LOWER5MINRRP?: number;
};

type AemoNoticeRow = {
  NOTICEID?: number;
  EFFECTIVEDATE?: string;
  EXTERNALREFERENCE?: string;
  TYPEID?: string;
  REASON?: string;
};

type AemoPayload = {
  ELEC_NEM_SUMMARY?: AemoSummaryRow[];
  ELEC_NEM_SUMMARY_PRICES?: AemoPriceRow[];
  ELEC_NEM_SUMMARY_MARKET_NOTICE?: AemoNoticeRow[];
};

export type InterconnectorFlow = {
  name: string;
  mw: number | null;
  exportLimitMw: number | null;
  importLimitMw: number | null;
};

export type NemRegionSnapshot = {
  regionId: NemRegion;
  name: string;
  state: string;
  settlementTime: string | null;
  priceAudPerMwh: number | null;
  priceStatus: string | null;
  totalDemandMw: number | null;
  scheduledGenerationMw: number | null;
  semiScheduledGenerationMw: number | null;
  netInterchangeMw: number | null;
  marketSuspended: boolean;
  administeredPriceCap: boolean;
  fcas: {
    raiseReg: number | null;
    lowerReg: number | null;
    raise1s: number | null;
    raise6s: number | null;
    raise60s: number | null;
    raise5min: number | null;
    lower1s: number | null;
    lower6s: number | null;
    lower60s: number | null;
    lower5min: number | null;
  } | null;
  interconnectors: InterconnectorFlow[];
};

const ATTRIBUTION =
  "Source: Australian Energy Market Operator (AEMO) NEM data dashboard / ELEC_NEM_SUMMARY. Not an official AEMO product. Prices are wholesale spot ($/MWh), not retail.";

function parseInterconnectors(raw?: string): InterconnectorFlow[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as {
      name?: string;
      value?: number;
      exportlimit?: number;
      importlimit?: number;
    }[];
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => ({
      name: x.name || "unknown",
      mw: typeof x.value === "number" ? x.value : null,
      exportLimitMw: typeof x.exportlimit === "number" ? x.exportlimit : null,
      importLimitMw: typeof x.importlimit === "number" ? x.importlimit : null,
    }));
  } catch {
    return [];
  }
}

function normRegion(id: string): NemRegion | null {
  const u = id.trim().toUpperCase();
  const aliases: Record<string, NemRegion> = {
    NSW: "NSW1",
    NSW1: "NSW1",
    QLD: "QLD1",
    QLD1: "QLD1",
    SA: "SA1",
    SA1: "SA1",
    TAS: "TAS1",
    TAS1: "TAS1",
    VIC: "VIC1",
    VIC1: "VIC1",
  };
  return aliases[u] || null;
}

async function fetchAemoSummary(): Promise<AemoPayload> {
  const res = await fetch(AEMO_SUMMARY_URL, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AEMO summary failed (${res.status}): ${t.slice(0, 160)}`);
  }
  return (await res.json()) as AemoPayload;
}

function buildSnapshots(payload: AemoPayload): NemRegionSnapshot[] {
  const pricesByRegion = new Map<string, AemoPriceRow>();
  for (const p of payload.ELEC_NEM_SUMMARY_PRICES || []) {
    if (p.REGIONID) pricesByRegion.set(p.REGIONID.toUpperCase(), p);
  }

  const out: NemRegionSnapshot[] = [];
  for (const row of payload.ELEC_NEM_SUMMARY || []) {
    const rid = (row.REGIONID || "").toUpperCase();
    const region = normRegion(rid);
    if (!region) continue;
    const meta = REGION_META[region];
    const fcas = pricesByRegion.get(region);
    out.push({
      regionId: region,
      name: meta.name,
      state: meta.state,
      settlementTime: row.SETTLEMENTDATE || null,
      priceAudPerMwh: typeof row.PRICE === "number" ? row.PRICE : null,
      priceStatus: row.PRICE_STATUS || null,
      totalDemandMw: typeof row.TOTALDEMAND === "number" ? row.TOTALDEMAND : null,
      scheduledGenerationMw:
        typeof row.SCHEDULEDGENERATION === "number" ? row.SCHEDULEDGENERATION : null,
      semiScheduledGenerationMw:
        typeof row.SEMISCHEDULEDGENERATION === "number"
          ? row.SEMISCHEDULEDGENERATION
          : null,
      netInterchangeMw:
        typeof row.NETINTERCHANGE === "number" ? row.NETINTERCHANGE : null,
      marketSuspended: Boolean(row.MARKETSUSPENDEDFLAG),
      administeredPriceCap: Boolean(row.APCFLAG),
      fcas: fcas
        ? {
            raiseReg: fcas.RAISEREGRRP ?? null,
            lowerReg: fcas.LOWERREGRRP ?? null,
            raise1s: fcas.RAISE1SECRRP ?? null,
            raise6s: fcas.RAISE6SECRRP ?? null,
            raise60s: fcas.RAISE60SECRRP ?? null,
            raise5min: fcas.RAISE5MINRRP ?? null,
            lower1s: fcas.LOWER1SECRRP ?? null,
            lower6s: fcas.LOWER6SECRRP ?? null,
            lower60s: fcas.LOWER60SECRRP ?? null,
            lower5min: fcas.LOWER5MINRRP ?? null,
          }
        : null,
      interconnectors: parseInterconnectors(row.INTERCONNECTORFLOWS),
    });
  }

  // stable region order
  out.sort(
    (a, b) => NEM_REGIONS.indexOf(a.regionId) - NEM_REGIONS.indexOf(b.regionId),
  );
  return out;
}

export function listEnergyProducts() {
  return {
    products: [
      {
        id: "nem",
        name: "National Electricity Market (NEM)",
        operator: "AEMO",
        regions: NEM_REGIONS.map((id) => ({ id, ...REGION_META[id] })),
        endpoints: [
          "/au-energy/nem",
          "/au-energy/nem/{region}",
          "/au-energy/notices",
        ],
      },
    ],
    planned: [
      {
        id: "gas",
        name: "Gas Bulletin Board",
        notes: "AEMO GBB — bulk/portal, not a clean public REST API yet.",
      },
      {
        id: "water",
        name: "Water utilities",
        notes: "State-by-state; no national retail water API.",
      },
    ],
    attribution: ATTRIBUTION,
  };
}

export async function getNemSummary() {
  const payload = await fetchAemoSummary();
  const regions = buildSnapshots(payload);
  const settlementTime = regions.find((r) => r.settlementTime)?.settlementTime || null;
  return {
    market: "NEM",
    settlementTime,
    regionCount: regions.length,
    regions,
    attribution: ATTRIBUTION,
    source: AEMO_SUMMARY_URL,
  };
}

export async function getNemRegion(regionInput: string) {
  const region = normRegion(regionInput);
  if (!region) {
    throw new Error(
      `Unknown NEM region '${regionInput}'. Use NSW1, QLD1, SA1, TAS1, or VIC1 (or NSW/QLD/SA/TAS/VIC).`,
    );
  }
  const summary = await getNemSummary();
  const snap = summary.regions.find((r) => r.regionId === region);
  if (!snap) {
    throw new Error(`No live data for region ${region}`);
  }
  return {
    market: "NEM",
    ...snap,
    attribution: ATTRIBUTION,
    source: AEMO_SUMMARY_URL,
  };
}

export async function getNemNotices(opts?: { limit?: number }) {
  const payload = await fetchAemoSummary();
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
  const notices = (payload.ELEC_NEM_SUMMARY_MARKET_NOTICE || [])
    .slice(0, limit)
    .map((n) => ({
      id: n.NOTICEID ?? null,
      effectiveAt: n.EFFECTIVEDATE || null,
      type: n.TYPEID || null,
      reference: n.EXTERNALREFERENCE || null,
      reason: n.REASON || null,
    }));
  return {
    market: "NEM",
    count: notices.length,
    notices,
    attribution: ATTRIBUTION,
    source: AEMO_SUMMARY_URL,
  };
}
