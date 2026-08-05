"use client";

import { useState } from "react";

type CpiResult = {
  indicator?: string;
  title?: string;
  latest?: { period: string; value: number | null };
  previous?: { period: string; value: number | null };
  changeQoQPercent?: number | null;
  changeYoYPercent?: number | null;
  catalogue?: string;
  attribution?: string;
  error?: string;
};

type Flow = { id: string; name: string; version?: string; agency?: string };

const EXAMPLES = [
  { label: "CPI headline", path: "/api/au-abs/cpi" },
  { label: "Search CPI flows", path: "/api/au-abs/dataflows?q=CPI&limit=8" },
  { label: "Wage Price Index flows", path: "/api/au-abs/dataflows?q=wage&limit=5" },
  {
    label: "CPI series from 2020",
    path: "/api/au-abs/data/CPI?key=1.10001.10.50.Q&startPeriod=2020",
  },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-t border-border-brand py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-mono text-fg">{value}</span>
    </div>
  );
}

export default function AbsDemo() {
  const [query, setQuery] = useState("CPI");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cpi, setCpi] = useState<CpiResult | null>(null);
  const [flows, setFlows] = useState<Flow[] | null>(null);
  const [rawHint, setRawHint] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function runPath(path: string) {
    setLoading(true);
    setError(null);
    setCpi(null);
    setFlows(null);
    setRawHint(null);
    setLastPath(path);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      if (path.includes("/cpi")) {
        setCpi(data as CpiResult);
      } else if (path.includes("/dataflows")) {
        setFlows(((data as { dataflows?: Flow[] }).dataflows || []) as Flow[]);
      } else {
        const seriesCount = (data as { seriesCount?: number }).seriesCount;
        const name = (data as { name?: string }).name;
        const obs =
          ((data as { series?: { observations?: unknown[] }[] }).series || [])[0]?.observations ||
          [];
        setRawHint(
          `${name || "Series"} · ${seriesCount ?? 0} series · ${obs.length} observations (latest ${
            (obs[obs.length - 1] as { period?: string; value?: number } | undefined)?.period || "—"
          } = ${
            (obs[obs.length - 1] as { period?: string; value?: number } | undefined)?.value ?? "—"
          })`,
        );
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    if (q.toUpperCase() === "CPI") {
      await runPath("/api/au-abs/cpi");
      return;
    }
    await runPath(`/api/au-abs/dataflows?q=${encodeURIComponent(q)}&limit=12`);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dataflows or type CPI for headline index"
          className="w-full flex-1 rounded-md border border-border-brand bg-card px-5 py-3 text-fg outline-none placeholder:text-muted/50 focus:border-brand-green"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-green px-6 py-3 font-mono text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? "…" : "Run"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.path}
            type="button"
            onClick={() => void runPath(ex.path)}
            className="border border-border-brand bg-card px-3 py-1.5 font-mono text-[11px] text-muted transition hover:border-brand-green hover:text-fg"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {lastPath && (
        <p className="mt-4 break-all font-mono text-[11px] text-muted">GET {lastPath}</p>
      )}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {cpi && (
        <div className="mt-6 border border-border-brand bg-card p-5">
          <p className="font-display text-xl tracking-tight text-fg">{cpi.title || "CPI"}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
            ABS {cpi.catalogue || "6401.0"}
          </p>
          <div className="mt-4">
            <Row
              label="Latest"
              value={
                cpi.latest
                  ? `${cpi.latest.period} · ${cpi.latest.value ?? "—"}`
                  : "—"
              }
            />
            <Row
              label="Previous"
              value={
                cpi.previous
                  ? `${cpi.previous.period} · ${cpi.previous.value ?? "—"}`
                  : "—"
              }
            />
            <Row
              label="QoQ"
              value={
                cpi.changeQoQPercent != null ? `${cpi.changeQoQPercent}%` : "—"
              }
            />
            <Row
              label="YoY"
              value={
                cpi.changeYoYPercent != null ? `${cpi.changeYoYPercent}%` : "—"
              }
            />
          </div>
          {cpi.attribution && (
            <p className="mt-4 text-xs text-muted">{cpi.attribution}</p>
          )}
        </div>
      )}

      {flows && (
        <div className="mt-6 border border-border-brand bg-card">
          {flows.length === 0 && (
            <p className="p-4 text-sm text-muted">No dataflows matched.</p>
          )}
          <ul className="divide-y divide-border-brand">
            {flows.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="font-mono text-sm text-fg">{f.id}</p>
                  <p className="text-sm text-muted">{f.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void runPath(
                      `/api/au-abs/data/${encodeURIComponent(f.id)}?startPeriod=2020`,
                    )
                  }
                  className="font-mono text-[11px] text-brand-green hover:underline"
                >
                  sample data
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rawHint && (
        <div className="mt-6 border border-border-brand bg-card p-5 font-mono text-sm text-fg">
          {rawHint}
        </div>
      )}
    </div>
  );
}
