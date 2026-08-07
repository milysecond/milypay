"use client";

import { useState } from "react";

interface Address {
  address: string;
  gnafPid: string;
  locality: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

const EXAMPLES = [
  "120 collins st melbourne",
  "1 bligh street sydney",
  "1 acland st kilda",
  "200 adelaide st brisbane",
];

export default function AddressDemo() {
  const [query, setQuery] = useState("120 collins st melbourne");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Address[] | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function run(q: string) {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setResults(null);
    const path = `/api/au-address/search?q=${encodeURIComponent(q.trim())}&limit=6`;
    setLastPath(path);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) setError(data.error || `Request failed (${res.status})`);
      else setResults(data.results || []);
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
            placeholder="Type an Australian address"
            className="w-full rounded-md border border-border-brand bg-card px-5 py-3 pr-11 text-fg outline-none placeholder:text-muted/50 focus:border-brand-green"
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
          disabled={loading || query.trim().length < 2}
          className="btn-primary disabled:opacity-40"
        >
          {loading ? "Searching..." : "Validate"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQuery(ex);
              void run(ex);
            }}
            className="rounded-full border border-border-brand px-3 py-1 transition hover:border-brand-green/40 hover:text-fg"
          >
            {ex}
          </button>
        ))}
      </div>

      {lastPath && (
        <div className="mt-6 max-w-full min-w-0 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border-brand bg-bg p-3 font-mono text-[11px] leading-relaxed text-muted [overflow-wrap:anywhere] sm:text-xs">
          <span className="text-brand-green">GET</span> https://milypay.xyz{lastPath}
        </div>
      )}

      <div className="mt-4">
        {error && <div className="card p-6 text-sm text-brand-purple">{error}</div>}
        {results && results.length === 0 && (
          <div className="card p-6 text-sm text-muted">No matching address found.</div>
        )}
        {results && results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((r, i) => (
              <div key={`${r.gnafPid}-${i}`} className="card flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{r.address}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    GNAF {r.gnafPid}
                    {r.lat != null && r.lng != null ? ` · ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}` : ""}
                  </p>
                </div>
                {r.lat != null && r.lng != null && (
                  <a
                    href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full border border-border-brand px-3 py-1.5 text-xs text-muted transition hover:border-brand-green/40 hover:text-fg"
                  >
                    Map
                  </a>
                )}
              </div>
            ))}
            <p className="px-1 text-xs text-muted">
              Incorporates G-NAF (c) Geoscape Australia, open licence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
