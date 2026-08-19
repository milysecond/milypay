/**
 * Aggregate usage stats: GA4 (milypay.xyz), npm downloads, live status.
 *
 * Env (Worker secrets):
 *   GA_CLIENT_ID / GA_CLIENT_SECRET / GA_REFRESH_TOKEN
 *   or GA_DATA_CREDENTIALS = JSON {client_id,client_secret,refresh_token}
 *   GA_PROPERTY_ID = 546984952 (default)
 */

export const GA_PROPERTY_ID =
  process.env.GA_PROPERTY_ID?.trim() || "546984952";
export const GA_MEASUREMENT_ID = "G-356WE6KS4T";

type GaCreds = {
  client_id: string;
  client_secret: string;
  refresh_token: string;
};

function gaCreds(): GaCreds | null {
  const raw = process.env.GA_DATA_CREDENTIALS?.trim();
  if (raw) {
    try {
      const j = JSON.parse(raw) as GaCreds;
      if (j.client_id && j.client_secret && j.refresh_token) return j;
    } catch {
      /* fall through */
    }
  }
  const client_id = process.env.GA_CLIENT_ID?.trim();
  const client_secret = process.env.GA_CLIENT_SECRET?.trim();
  const refresh_token = process.env.GA_REFRESH_TOKEN?.trim();
  if (client_id && client_secret && refresh_token) {
    return { client_id, client_secret, refresh_token };
  }
  return null;
}

async function gaAccessToken(creds: GaCreds): Promise<string> {
  const body = new URLSearchParams({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    refresh_token: creds.refresh_token,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || `GA token refresh failed (${res.status})`);
  }
  return data.access_token;
}

async function gaRunReport(
  access: string,
  propertyId: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${access}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data && "error" in data
        ? JSON.stringify((data as { error: unknown }).error).slice(0, 300)
        : `GA report ${res.status}`,
    );
  }
  return data;
}

function metricRow(report: unknown, index = 0): number {
  const rows = (report as { rows?: { metricValues?: { value?: string }[] }[] })
    ?.rows;
  const v = rows?.[0]?.metricValues?.[index]?.value;
  return v != null ? Number(v) || 0 : 0;
}

function pageRows(
  report: unknown,
): Array<{ path: string; views: number; users: number }> {
  const rows =
    (report as {
      rows?: {
        dimensionValues?: { value?: string }[];
        metricValues?: { value?: string }[];
      }[];
    })?.rows || [];
  return rows.map((r) => ({
    path: r.dimensionValues?.[0]?.value || "/",
    views: Number(r.metricValues?.[0]?.value || 0),
    users: Number(r.metricValues?.[1]?.value || 0),
  }));
}

function dayRows(
  report: unknown,
): Array<{ date: string; users: number; sessions: number; views: number }> {
  const rows =
    (report as {
      rows?: {
        dimensionValues?: { value?: string }[];
        metricValues?: { value?: string }[];
      }[];
    })?.rows || [];
  return rows
    .map((r) => {
      const raw = r.dimensionValues?.[0]?.value || "";
      // YYYYMMDD → YYYY-MM-DD
      const date =
        raw.length === 8
          ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
          : raw;
      return {
        date,
        users: Number(r.metricValues?.[0]?.value || 0),
        sessions: Number(r.metricValues?.[1]?.value || 0),
        views: Number(r.metricValues?.[2]?.value || 0),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type NpmPackageStats = {
  package: string;
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
  series: Array<{ day: string; downloads: number }>;
};

async function npmPackage(name: string): Promise<NpmPackageStats> {
  const [day, week, month, range] = await Promise.all([
    fetch(`https://api.npmjs.org/downloads/point/last-day/${name}`, {
      signal: AbortSignal.timeout(12_000),
    }).then((r) => r.json() as Promise<{ downloads?: number }>),
    fetch(`https://api.npmjs.org/downloads/point/last-week/${name}`, {
      signal: AbortSignal.timeout(12_000),
    }).then((r) => r.json() as Promise<{ downloads?: number }>),
    fetch(`https://api.npmjs.org/downloads/point/last-month/${name}`, {
      signal: AbortSignal.timeout(12_000),
    }).then((r) => r.json() as Promise<{ downloads?: number }>),
    fetch(`https://api.npmjs.org/downloads/range/last-month/${name}`, {
      signal: AbortSignal.timeout(12_000),
    }).then(
      (r) =>
        r.json() as Promise<{
          downloads?: Array<{ day: string; downloads: number }>;
        }>,
    ),
  ]);
  return {
    package: name,
    lastDay: day.downloads || 0,
    lastWeek: week.downloads || 0,
    lastMonth: month.downloads || 0,
    series: range.downloads || [],
  };
}

export type UsageStats = {
  ok: boolean;
  checkedAt: string;
  brand: "Milypay";
  sources: {
    ga4: boolean;
    npm: boolean;
    status: boolean;
  };
  ga4?: {
    propertyId: string;
    measurementId: string;
    yesterday: { users: number; sessions: number; views: number; events: number };
    last7d: { users: number; sessions: number; views: number; events: number };
    last28d: { users: number; sessions: number; views: number; events: number };
    topPages7d: Array<{ path: string; views: number; users: number }>;
    daily7d: Array<{
      date: string;
      users: number;
      sessions: number;
      views: number;
    }>;
    error?: string;
  };
  npm?: {
    milypay: NpmPackageStats;
    milypaySdk: NpmPackageStats;
    error?: string;
  };
  status?: {
    overall?: string;
    x402?: boolean;
    moneygram?: unknown;
    hosts?: unknown;
    error?: string;
  };
  links: {
    dashboard: string;
    fund: string;
    agents: string;
    ga: string;
    npmCli: string;
    npmSdk: string;
  };
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function collectUsageStats(): Promise<UsageStats> {
  const checkedAt = new Date().toISOString();
  const out: UsageStats = {
    ok: true,
    checkedAt,
    brand: "Milypay",
    sources: { ga4: false, npm: false, status: false },
    links: {
      dashboard: "https://milypay.xyz/dashboard",
      fund: "https://milypay.xyz/fund",
      agents: "https://milypay.xyz/agents.md",
      ga: `https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID}/`,
      npmCli: "https://www.npmjs.com/package/milypay",
      npmSdk: "https://www.npmjs.com/package/milypay-sdk",
    },
  };

  // npm (public)
  try {
    const [milypay, milypaySdk] = await Promise.all([
      npmPackage("milypay"),
      npmPackage("milypay-sdk"),
    ]);
    out.npm = { milypay, milypaySdk };
    out.sources.npm = true;
  } catch (e) {
    out.npm = {
      milypay: {
        package: "milypay",
        lastDay: 0,
        lastWeek: 0,
        lastMonth: 0,
        series: [],
      },
      milypaySdk: {
        package: "milypay-sdk",
        lastDay: 0,
        lastWeek: 0,
        lastMonth: 0,
        series: [],
      },
      error: e instanceof Error ? e.message : "npm_failed",
    };
  }

  // status (public) — prefer same-origin path when available
  try {
    const statusUrls = [
      "https://milypay.xyz/api/status",
      "https://api.milypay.xyz/status",
    ];
    let data: Record<string, unknown> | null = null;
    let ok = false;
    for (const u of statusUrls) {
      try {
        const res = await fetch(u, {
          headers: {
            accept: "application/json",
            "user-agent": "milypay-stats/1.0",
          },
          signal: AbortSignal.timeout(12_000),
          cache: "no-store",
        });
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("json")) continue;
        data = (await res.json()) as Record<string, unknown>;
        ok = res.ok;
        if (ok) break;
      } catch {
        /* try next */
      }
    }
    if (data) {
      out.status = {
        overall: String(data.status || data.ok || ""),
        x402: Boolean(data.x402),
        moneygram: data.moneygram,
        hosts: data.hosts,
      };
      out.sources.status = ok;
    } else {
      out.status = { error: "status_unreachable" };
    }
  } catch (e) {
    out.status = {
      error: e instanceof Error ? e.message : "status_failed",
    };
  }

  // GA4
  const creds = gaCreds();
  if (!creds) {
    out.ga4 = {
      propertyId: GA_PROPERTY_ID,
      measurementId: GA_MEASUREMENT_ID,
      yesterday: { users: 0, sessions: 0, views: 0, events: 0 },
      last7d: { users: 0, sessions: 0, views: 0, events: 0 },
      last28d: { users: 0, sessions: 0, views: 0, events: 0 },
      topPages7d: [],
      daily7d: [],
      error: "GA credentials not configured (set GA_DATA_CREDENTIALS)",
    };
  } else {
    try {
      const access = await gaAccessToken(creds);
      const today = new Date();
      const y = new Date(today);
      y.setUTCDate(y.getUTCDate() - 1);
      const d7 = new Date(y);
      d7.setUTCDate(d7.getUTCDate() - 6);
      const d28 = new Date(y);
      d28.setUTCDate(d28.getUTCDate() - 27);

      const metrics = [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "eventCount" },
      ];

      const [rY, r7, r28, rPages, rDaily] = await Promise.all([
        gaRunReport(access, GA_PROPERTY_ID, {
          dateRanges: [{ startDate: ymd(y), endDate: ymd(y) }],
          metrics,
        }),
        gaRunReport(access, GA_PROPERTY_ID, {
          dateRanges: [{ startDate: ymd(d7), endDate: ymd(y) }],
          metrics,
        }),
        gaRunReport(access, GA_PROPERTY_ID, {
          dateRanges: [{ startDate: ymd(d28), endDate: ymd(y) }],
          metrics,
        }),
        gaRunReport(access, GA_PROPERTY_ID, {
          dateRanges: [{ startDate: ymd(d7), endDate: ymd(y) }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 12,
        }),
        gaRunReport(access, GA_PROPERTY_ID, {
          dateRanges: [{ startDate: ymd(d7), endDate: ymd(y) }],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
          ],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        }),
      ]);

      const pack = (r: unknown) => ({
        users: metricRow(r, 0),
        sessions: metricRow(r, 1),
        views: metricRow(r, 2),
        events: metricRow(r, 3),
      });

      out.ga4 = {
        propertyId: GA_PROPERTY_ID,
        measurementId: GA_MEASUREMENT_ID,
        yesterday: pack(rY),
        last7d: pack(r7),
        last28d: pack(r28),
        topPages7d: pageRows(rPages),
        daily7d: dayRows(rDaily),
      };
      out.sources.ga4 = true;
    } catch (e) {
      out.ga4 = {
        propertyId: GA_PROPERTY_ID,
        measurementId: GA_MEASUREMENT_ID,
        yesterday: { users: 0, sessions: 0, views: 0, events: 0 },
        last7d: { users: 0, sessions: 0, views: 0, events: 0 },
        last28d: { users: 0, sessions: 0, views: 0, events: 0 },
        topPages7d: [],
        daily7d: [],
        error: e instanceof Error ? e.message : "ga_failed",
      };
    }
  }

  out.ok = out.sources.npm || out.sources.ga4 || out.sources.status;
  return out;
}
