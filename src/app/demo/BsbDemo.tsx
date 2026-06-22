"use client";

import { useState } from "react";

interface BsbEntry {
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

const EXAMPLES = [
  { label: "ANZ Sydney", bsb: "012-002" },
  { label: "CBA Melbourne", bsb: "063-000" },
  { label: "Westpac Adelaide", bsb: "033-539" },
  { label: "NAB Brisbane", bsb: "084-004" },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-t border-border-brand py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right text-fg">{value}</span>
    </div>
  );
}

export default function BsbDemo() {
  const [query, setQuery] = useState("012-002");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BsbEntry | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function run(bsb: string) {
    if (!bsb.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const path = `/api/au-bsb/${encodeURIComponent(bsb.trim())}`;
    setLastPath(path);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) setError(data.error || `Request failed (${res.status})`);
      else setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(query);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="BSB number, e.g. 012-002 or 012002"
            className="w-full rounded-full border border-border-brand bg-card px-5 py-3 pr-11 text-fg outline-none placeholder:text-muted/50 focus:border-brand-green"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-border-brand hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Looking up..." : "Look up"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.bsb}
            type="button"
            onClick={() => {
              setQuery(ex.bsb);
              void run(ex.bsb);
            }}
            className="rounded-full border border-border-brand px-3 py-1 transition hover:border-brand-green/40 hover:text-fg"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {lastPath && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border-brand bg-bg p-3 font-mono text-xs text-muted">
          <span className="text-brand-green">GET</span> https://milypay.xyz{lastPath}
        </div>
      )}

      <div className="mt-4">
        {error && <div className="card p-6 text-sm text-brand-purple">{error}</div>}
        {result && (
          <div className="card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl tracking-tight">
                  {result.bankName || result.bank}
                </h3>
                <p className="mt-0.5 text-sm text-muted">{result.branch}</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-full border border-border-brand px-3 py-1 text-sm font-semibold text-brand-purple">
                  {result.bsb}
                </code>
                {result.merged && (
                  <span className="rounded-full border border-border-brand px-2.5 py-0.5 text-xs font-semibold text-muted">
                    Merged
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5">
              <Row label="Bank code" value={result.bank} />
              <Row
                label="Address"
                value={[result.address, result.suburb, result.state, result.postcode]
                  .filter(Boolean)
                  .join(", ")}
              />
              {result.merged && result.mergedTo && (
                <Row label="Redirects to" value={result.mergedTo} />
              )}
            </div>

            {result.services.length > 0 && (
              <div className="mt-5 border-t border-border-brand pt-4">
                <p className="text-xs uppercase tracking-widest text-muted">
                  Payment methods
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  {result.services.map((s) => (
                    <div key={s} className="flex items-center gap-2 text-sm text-fg">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
