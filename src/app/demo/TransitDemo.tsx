"use client";

import { useCallback, useState } from "react";

type Summary = {
  region?: string;
  mode?: string;
  name?: string;
  operator?: string;
  vehicles?: number;
  tripUpdates?: number;
  alerts?: number;
  error?: string;
  sample?: { vehicle?: { routeId?: string; lat?: number; lon?: number; label?: string } };
};

const PRESETS: { region: string; mode?: string; label: string }[] = [
  { region: "seq", label: "QLD SEQ" },
  { region: "sa", label: "Adelaide" },
  { region: "vic", mode: "metro", label: "VIC metro" },
  { region: "vic", mode: "tram", label: "VIC tram" },
  { region: "nsw", mode: "sydneytrains", label: "NSW trains" },
  { region: "nsw", mode: "buses", label: "NSW buses" },
];

export default function TransitDemo() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(PRESETS[0].label);

  const load = useCallback(async (region: string, mode?: string, label?: string) => {
    setLoading(true);
    setErr(null);
    if (label) setActive(label);
    try {
      const qs = mode ? `?mode=${encodeURIComponent(mode)}` : "";
      const res = await fetch(`/api/au-transit/${encodeURIComponent(region)}/summary${qs}`);
      const json = (await res.json()) as Summary;
      if (!res.ok) throw new Error(json.error || res.statusText);
      setData(json);
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <div className="border border-border-brand bg-card p-6">
        <h2 className="font-display text-xl tracking-tight">Public transport (GTFS-RT)</h2>
        <p className="mt-2 text-sm text-muted">
          Live vehicle / trip-update / alert counts. QLD &amp; SA open; VIC &amp; NSW via portal keys.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={loading}
              onClick={() => void load(p.region, p.mode, p.label)}
              className={`rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                active === p.label
                  ? "border-brand-green bg-brand-green text-cta-fg"
                  : "border-border-brand text-muted hover:text-fg"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
        {err && <p className="mt-6 text-sm text-red-400">{err}</p>}
        {data && !loading && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Vehicles" value={data.vehicles} />
            <Stat label="Trip updates" value={data.tripUpdates} />
            <Stat label="Alerts" value={data.alerts} />
            <div className="sm:col-span-3 font-mono text-xs text-muted">
              {data.operator || data.name || data.region}
              {data.mode ? ` · mode ${data.mode}` : ""}
              {data.sample?.vehicle?.routeId
                ? ` · sample route ${data.sample.vehicle.routeId}`
                : ""}
            </div>
          </div>
        )}
        {!data && !loading && !err && (
          <p className="mt-6 text-sm text-muted">Pick a region to load a live summary.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="border border-border-brand bg-background p-4">
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl">
        {value != null ? value.toLocaleString() : "—"}
      </div>
    </div>
  );
}
