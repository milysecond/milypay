/**
 * ABS Data API client (SDMX 2.1 REST).
 * Upstream: https://data.api.abs.gov.au/rest/
 * Docs: https://www.abs.gov.au/statistics/application-programming-interfaces-apis/data-api-user-guide
 * No API key required.
 */

const ABS_BASE = process.env.ABS_DATA_API_URL || "https://data.api.abs.gov.au/rest";
const UA = "Milypay/1.0 (+https://milypay.xyz; ABS data reseller)";

export type AbsDataflow = {
  id: string;
  agency: string;
  version?: string;
  name: string;
  description?: string;
};

export type AbsObservation = {
  period: string;
  value: number | null;
};

export type AbsSeries = {
  key: string;
  dimensions: Record<string, { id: string; name?: string }>;
  observations: AbsObservation[];
};

async function absFetch(path: string, accept: string): Promise<Response> {
  const url = path.startsWith("http") ? path : `${ABS_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": UA,
    },
    signal: AbortSignal.timeout(28_000),
  });
  return res;
}

function flowName(f: {
  name?: string;
  names?: Record<string, string>;
  description?: string;
  descriptions?: Record<string, string>;
}): { name: string; description?: string } {
  const name = f.name || f.names?.en || f.names?.["en"] || "Untitled";
  const description = f.description || f.descriptions?.en || f.descriptions?.["en"];
  return { name, description };
}

/** List ABS dataflows (cached briefly by caller). */
export async function listDataflows(opts?: {
  q?: string;
  limit?: number;
}): Promise<{ count: number; total: number; dataflows: AbsDataflow[]; attribution: string }> {
  const res = await absFetch(
    "/dataflow/ABS?detail=allstubs",
    "application/vnd.sdmx.structure+json;version=1.0;charset=utf-8",
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`ABS dataflow list failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const d = (await res.json()) as {
    data?: {
      dataflows?: {
        id: string;
        agencyID?: string;
        version?: string;
        name?: string;
        names?: Record<string, string>;
        description?: string;
        descriptions?: Record<string, string>;
      }[];
    };
  };
  let flows = (d.data?.dataflows || []).map((f) => {
    const { name, description } = flowName(f);
    return {
      id: f.id,
      agency: f.agencyID || "ABS",
      version: f.version,
      name,
      description,
    } satisfies AbsDataflow;
  });

  const q = (opts?.q || "").trim().toLowerCase();
  if (q) {
    flows = flows.filter(
      (f) =>
        f.id.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        (f.description || "").toLowerCase().includes(q),
    );
  }

  const total = flows.length;
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
  flows = flows.slice(0, limit);

  return {
    count: flows.length,
    total,
    dataflows: flows,
    attribution:
      "Source: Australian Bureau of Statistics (ABS) Data API — data.api.abs.gov.au. Licensed under Creative Commons Attribution 4.0 International.",
  };
}

/** Dataflow structure/metadata. */
export async function getDataflow(id: string): Promise<Record<string, unknown>> {
  const flowId = id.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(flowId)) {
    throw new Error("Invalid dataflow id");
  }
  const res = await absFetch(
    `/dataflow/ABS/${encodeURIComponent(flowId)}/latest?references=all`,
    "application/vnd.sdmx.structure+json;version=1.0;charset=utf-8",
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`ABS dataflow ${flowId} failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const d = (await res.json()) as Record<string, unknown>;
  return {
    dataflow: flowId,
    agency: "ABS",
    raw: d,
    attribution:
      "Source: Australian Bureau of Statistics (ABS) Data API — data.api.abs.gov.au. Licensed under Creative Commons Attribution 4.0 International.",
  };
}

export type AbsDataQuery = {
  /** Dataflow id e.g. CPI */
  dataflow: string;
  /** SDMX key path e.g. 1.10001.10.50.Q or "all" */
  key?: string;
  startPeriod?: string;
  endPeriod?: string;
  /** ABS agency default ABS */
  agency?: string;
  version?: string;
};

/** Fetch and normalise a data query into series + observations. */
export async function getData(q: AbsDataQuery): Promise<{
  dataflow: string;
  key: string;
  name?: string;
  description?: string;
  series: AbsSeries[];
  seriesCount: number;
  attribution: string;
  query: AbsDataQuery;
}> {
  const agency = (q.agency || "ABS").trim().toUpperCase();
  const flow = q.dataflow.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(flow)) throw new Error("Invalid dataflow id");
  const key = (q.key || "all").trim() || "all";
  if (!/^[A-Za-z0-9_.*+\-]+$/.test(key) && key !== "all") {
    throw new Error("Invalid series key");
  }

  const version = q.version ? `,${q.version}` : "";
  const params = new URLSearchParams({ format: "jsondata" });
  if (q.startPeriod) params.set("startPeriod", q.startPeriod);
  if (q.endPeriod) params.set("endPeriod", q.endPeriod);

  const path = `/data/${agency},${flow}${version}/${encodeURIComponent(key)}?${params}`;
  const res = await absFetch(path, "application/json");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`ABS data query failed (${res.status}): ${t.slice(0, 240)}`);
  }
  const d = (await res.json()) as {
    data?: {
      dataSets?: {
        series?: Record<string, { observations?: Record<string, (number | null)[]> }>;
      }[];
      structures?: {
        name?: string;
        names?: Record<string, string>;
        description?: string;
        descriptions?: Record<string, string>;
        dimensions?: {
          series?: {
            id: string;
            name?: string;
            names?: Record<string, string>;
            values?: { id: string; name?: string; names?: Record<string, string> }[];
          }[];
          observation?: {
            id: string;
            name?: string;
            values?: { id: string; name?: string; names?: Record<string, string> }[];
          }[];
        };
      }[];
    };
  };

  const structure = d.data?.structures?.[0];
  const name = structure?.name || structure?.names?.en;
  const description = structure?.description || structure?.descriptions?.en;
  const seriesDims = structure?.dimensions?.series || [];
  const obsDims = structure?.dimensions?.observation || [];
  const timeValues = obsDims.find((x) => x.id === "TIME_PERIOD" || x.id === "TIME")?.values || [];

  const ds = d.data?.dataSets?.[0];
  const rawSeries = ds?.series || {};
  const series: AbsSeries[] = [];

  for (const [skey, sbody] of Object.entries(rawSeries)) {
    const parts = skey.split(":");
    const dimensions: Record<string, { id: string; name?: string }> = {};
    seriesDims.forEach((dim, i) => {
      const idx = Number(parts[i]);
      const val = dim.values?.[idx];
      if (val) {
        dimensions[dim.id] = {
          id: val.id,
          name: val.name || val.names?.en,
        };
      }
    });

    const observations: AbsObservation[] = [];
    const obs = sbody.observations || {};
    for (const [oi, arr] of Object.entries(obs)) {
      const t = timeValues[Number(oi)];
      const period = t?.id || t?.name || oi;
      const value = Array.isArray(arr) ? (arr[0] as number | null) : null;
      observations.push({ period, value });
    }
    // sort by period string
    observations.sort((a, b) => a.period.localeCompare(b.period));

    series.push({ key: skey, dimensions, observations });
  }

  return {
    dataflow: flow,
    key,
    name,
    description,
    series,
    seriesCount: series.length,
    attribution:
      "Source: Australian Bureau of Statistics (ABS) Data API — data.api.abs.gov.au. Licensed under Creative Commons Attribution 4.0 International.",
    query: q,
  };
}

/**
 * Convenience: headline All groups CPI, Australia, quarterly index.
 * Default key 1.10001.10.50.Q is the common ABS CPI series used in docs examples.
 */
export async function getCpi(opts?: {
  startPeriod?: string;
  endPeriod?: string;
  key?: string;
}) {
  const startPeriod = opts?.startPeriod || "2015";
  const key = opts?.key || "1.10001.10.50.Q";
  const data = await getData({
    dataflow: "CPI",
    key,
    startPeriod,
    endPeriod: opts?.endPeriod,
  });

  const primary = data.series[0];
  const obs = primary?.observations || [];
  const latest = obs.length ? obs[obs.length - 1] : null;
  const prev = obs.length > 1 ? obs[obs.length - 2] : null;
  let qoq: number | null = null;
  let yoy: number | null = null;
  if (latest?.value != null && prev?.value != null && prev.value !== 0) {
    qoq = ((latest.value - prev.value) / prev.value) * 100;
  }
  if (latest?.value != null && obs.length >= 5) {
    const yearAgo = obs[obs.length - 5];
    if (yearAgo?.value != null && yearAgo.value !== 0) {
      yoy = ((latest.value - yearAgo.value) / yearAgo.value) * 100;
    }
  }

  return {
    indicator: "CPI",
    title: data.name || "Consumer Price Index (CPI)",
    description: data.description,
    seriesKey: key,
    latest,
    previous: prev,
    changeQoQPercent: qoq != null ? Math.round(qoq * 100) / 100 : null,
    changeYoYPercent: yoy != null ? Math.round(yoy * 100) / 100 : null,
    observations: obs,
    dimensions: primary?.dimensions || {},
    attribution: data.attribution,
    catalogue: "6401.0",
  };
}

/** Convenience: Wage Price Index if available with broad key. */
export async function getWpi(opts?: { startPeriod?: string; endPeriod?: string; key?: string }) {
  const data = await getData({
    dataflow: "WPI",
    key: opts?.key || "all",
    startPeriod: opts?.startPeriod || "2020",
    endPeriod: opts?.endPeriod,
  });
  return {
    indicator: "WPI",
    title: data.name || "Wage Price Index",
    seriesCount: data.seriesCount,
    series: data.series.slice(0, 20),
    attribution: data.attribution,
  };
}
