"use client";

import { useEffect, useState } from "react";

type Region = {
  regionId: string;
  name: string;
  priceAudPerMwh: number | null;
  totalDemandMw: number | null;
  priceStatus: string | null;
};

type NemSummary = {
  settlementTime?: string;
  regions?: Region[];
  error?: string;
};

export default function EnergyDemo() {
  const [data, setData] = useState<NemSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/au-energy/nem");
        const json = (await res.json()) as NemSummary;
        if (!res.ok) throw new Error(json.error || res.statusText);
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <div className="border border-border-brand bg-card p-6">
        <h2 className="font-display text-xl tracking-tight">NEM wholesale (live)</h2>
        <p className="mt-2 text-sm text-muted">
          AEMO spot $/MWh and demand — not retail tariffs. Auto-refreshes on load.
        </p>
        {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
        {err && <p className="mt-6 text-sm text-red-400">{err}</p>}
        {data && !loading && (
          <>
            <p className="mt-4 font-mono text-xs text-muted">
              Settlement {data.settlementTime || "—"}
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="font-mono text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="py-2 pr-4">Region</th>
                    <th className="py-2 pr-4">Price $/MWh</th>
                    <th className="py-2 pr-4">Demand MW</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.regions || []).map((r) => (
                    <tr key={r.regionId} className="border-t border-border-brand">
                      <td className="py-2 pr-4 font-medium">
                        {r.regionId}{" "}
                        <span className="text-muted">· {r.name}</span>
                      </td>
                      <td className="py-2 pr-4 font-mono">
                        {r.priceAudPerMwh != null ? r.priceAudPerMwh.toFixed(2) : "—"}
                      </td>
                      <td className="py-2 pr-4 font-mono">
                        {r.totalDemandMw != null
                          ? Math.round(r.totalDemandMw).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-2 font-mono text-xs text-muted">
                        {r.priceStatus || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-muted">
              Try:{" "}
              <code className="text-brand-purple">npx milypay nem</code> ·{" "}
              <code className="text-brand-purple">npx milypay nem vic</code>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
