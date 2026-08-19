"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Pack = { users: number; sessions: number; views: number; events: number };
type PageRow = { path: string; views: number; users: number };
type DayRow = { date: string; users: number; sessions: number; views: number };
type NpmPkg = {
  package: string;
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
  series: Array<{ day: string; downloads: number }>;
};

type Stats = {
  ok: boolean;
  checkedAt: string;
  sources: { ga4: boolean; npm: boolean; status: boolean };
  ga4?: {
    measurementId: string;
    propertyId: string;
    yesterday: Pack;
    last7d: Pack;
    last28d: Pack;
    topPages7d: PageRow[];
    daily7d: DayRow[];
    error?: string;
  };
  npm?: {
    milypay: NpmPkg;
    milypaySdk: NpmPkg;
    error?: string;
  };
  status?: {
    overall?: string;
    x402?: boolean;
    moneygram?: { funding?: boolean; demo?: string };
    error?: string;
  };
  links?: Record<string, string>;
  error?: string;
};

function fmt(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-AU").format(n);
}

function Spark({
  values,
  color = "#0d9488",
}: {
  values: number[];
  color?: string;
}) {
  const w = 160;
  const h = 40;
  const max = Math.max(1, ...values);
  const pts = values
    .map((v, i) => {
      const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
    </svg>
  );
}

function Card({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "1rem 1.1rem",
        background: "#fff",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#64748b",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: 4, color: "#0f172a" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{sub}</div>
      )}
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      const data = (await res.json()) as Stats;
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStats(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 120_000);
    return () => clearInterval(t);
  }, [load]);

  const npmSeries = useMemo(() => {
    const a = stats?.npm?.milypay.series.map((x) => x.downloads) || [];
    const b = stats?.npm?.milypaySdk.series.map((x) => x.downloads) || [];
    return { a, b };
  }, [stats]);

  const gaSeries = useMemo(
    () => stats?.ga4?.daily7d.map((d) => d.views) || [],
    [stats],
  );

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "2rem 1.25rem 4rem",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        color: "#0f172a",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#0f766e",
              fontWeight: 700,
            }}
          >
            Milypay
          </p>
          <h1 style={{ margin: "0.25rem 0 0", fontSize: "1.85rem" }}>Usage dashboard</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#64748b", fontSize: 14 }}>
            GA4 site traffic · npm installs · API status
            {stats?.checkedAt
              ? ` · updated ${new Date(stats.checkedAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="/" style={linkBtn}>
            Home
          </a>
          <a href="/fund" style={linkBtn}>
            Fund
          </a>
          <a href="/api/stats" style={linkBtn}>
            JSON
          </a>
          <button type="button" onClick={() => void load()} style={primaryBtn} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {err && (
        <p role="alert" style={{ color: "#b91c1c", background: "#fef2f2", padding: 12, borderRadius: 8 }}>
          {err}
        </p>
      )}

      {/* Source pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        {[
          ["GA4", stats?.sources.ga4],
          ["npm", stats?.sources.npm],
          ["status", stats?.sources.status],
        ].map(([name, ok]) => (
          <span
            key={String(name)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "0.25rem 0.6rem",
              borderRadius: 999,
              background: ok ? "#ccfbf1" : "#fee2e2",
              color: ok ? "#115e59" : "#991b1b",
            }}
          >
            {name} {ok ? "live" : "off"}
          </span>
        ))}
        {stats?.status?.x402 != null && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "0.25rem 0.6rem",
              borderRadius: 999,
              background: stats.status.x402 ? "#dbeafe" : "#f1f5f9",
              color: "#1e3a8a",
            }}
          >
            x402 {stats.status.x402 ? "on" : "off"}
          </span>
        )}
      </div>

      {/* GA KPIs */}
      <h2 style={h2}>Site (GA4 · {stats?.ga4?.measurementId || "G-356WE6KS4T"})</h2>
      {stats?.ga4?.error && (
        <p style={{ color: "#b45309", fontSize: 13 }}>GA: {stats.ga4.error}</p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Card
          label="Users · yesterday"
          value={fmt(stats?.ga4?.yesterday.users)}
          sub={`${fmt(stats?.ga4?.yesterday.views)} views`}
        />
        <Card
          label="Users · 7 days"
          value={fmt(stats?.ga4?.last7d.users)}
          sub={`${fmt(stats?.ga4?.last7d.sessions)} sessions`}
        />
        <Card
          label="Views · 7 days"
          value={fmt(stats?.ga4?.last7d.views)}
          sub={`${fmt(stats?.ga4?.last7d.events)} events`}
        />
        <Card
          label="Users · 28 days"
          value={fmt(stats?.ga4?.last28d.users)}
          sub={`${fmt(stats?.ga4?.last28d.views)} views`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
          marginBottom: "1.75rem",
        }}
      >
        <div style={panel}>
          <div style={panelTitle}>Views · last 7 days</div>
          {gaSeries.length ? (
            <Spark values={gaSeries} />
          ) : (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No series yet</p>
          )}
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
            {(stats?.ga4?.daily7d || []).map((d) => (
              <div
                key={d.date}
                style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
              >
                <span>{d.date.slice(5)}</span>
                <span>
                  {d.views} views · {d.users} users
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={panel}>
          <div style={panelTitle}>Top pages · 7 days</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", textAlign: "left" }}>
                <th style={th}>Path</th>
                <th style={th}>Views</th>
                <th style={th}>Users</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.ga4?.topPages7d || []).map((p) => (
                <tr key={p.path} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={td}>
                    <code style={{ fontSize: 12 }}>{p.path}</code>
                  </td>
                  <td style={td}>{fmt(p.views)}</td>
                  <td style={td}>{fmt(p.users)}</td>
                </tr>
              ))}
              {!stats?.ga4?.topPages7d?.length && (
                <tr>
                  <td colSpan={3} style={{ ...td, color: "#94a3b8" }}>
                    No page data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* npm */}
      <h2 style={h2}>npm packages</h2>
      {stats?.npm?.error && (
        <p style={{ color: "#b45309", fontSize: 13 }}>npm: {stats.npm.error}</p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginBottom: "1.75rem",
        }}
      >
        {(
          [
            ["milypay (CLI/MCP)", stats?.npm?.milypay, npmSeries.a, stats?.links?.npmCli],
            ["milypay-sdk", stats?.npm?.milypaySdk, npmSeries.b, stats?.links?.npmSdk],
          ] as const
        ).map(([title, pkg, series, href]) => (
          <div key={title} style={panel}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <div style={panelTitle}>{title}</div>
              {href && (
                <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                  npm ↗
                </a>
              )}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                margin: "0.5rem 0",
              }}
            >
              <div>
                <div style={kpiLabel}>Day</div>
                <div style={kpiVal}>{fmt(pkg?.lastDay)}</div>
              </div>
              <div>
                <div style={kpiLabel}>Week</div>
                <div style={kpiVal}>{fmt(pkg?.lastWeek)}</div>
              </div>
              <div>
                <div style={kpiLabel}>Month</div>
                <div style={kpiVal}>{fmt(pkg?.lastMonth)}</div>
              </div>
            </div>
            {series.length > 0 ? <Spark values={series} color="#2563eb" /> : null}
          </div>
        ))}
      </div>

      {/* status */}
      <h2 style={h2}>Platform</h2>
      <div style={{ ...panel, marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14 }}>
          <div>
            <span style={kpiLabel}>API status</span>
            <div style={kpiVal}>{stats?.status?.overall || "—"}</div>
          </div>
          <div>
            <span style={kpiLabel}>MoneyGram fund</span>
            <div style={kpiVal}>
              {stats?.status?.moneygram ? "wired" : "—"}{" "}
              <a href="/fund" style={{ fontSize: 13, fontWeight: 500 }}>
                /fund
              </a>
            </div>
          </div>
          <div>
            <span style={kpiLabel}>Agents</span>
            <div style={kpiVal}>
              <a href="/agents.md">agents.md</a>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8" }}>
        Data: Google Analytics Data API (property {stats?.ga4?.propertyId || "546984952"}) ·
        registry.npmjs.org · api.milypay.xyz/status. Auto-refresh 2 min. API:{" "}
        <code>/api/stats</code>
      </p>
    </main>
  );
}

const h2: React.CSSProperties = {
  fontSize: "1.05rem",
  margin: "0 0 0.75rem",
  color: "#0f172a",
};

const panel: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "1rem 1.1rem",
  background: "#fff",
};

const panelTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
  marginBottom: 6,
};

const th: React.CSSProperties = { padding: "0.35rem 0.25rem", fontWeight: 600 };
const td: React.CSSProperties = { padding: "0.4rem 0.25rem" };

const kpiLabel: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#94a3b8",
  fontWeight: 600,
};
const kpiVal: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 700 };

const linkBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "0.45rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
};

const primaryBtn: React.CSSProperties = {
  ...linkBtn,
  background: "#0f766e",
  borderColor: "#0f766e",
  color: "#fff",
  cursor: "pointer",
};
