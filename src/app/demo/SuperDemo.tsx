"use client";

import { useState } from "react";

interface Product {
  usi: string;
  productName: string;
  contributionsRestricted: boolean;
}
interface Fund {
  abn: string;
  abnStatus: string;
  fundName: string | null;
  fundType: string | null;
  complyingStatus: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  products: Product[];
}

const EXAMPLES = [
  { label: "AustralianSuper", abn: "65714394898" },
  { label: "Hostplus", abn: "68657495890" },
  { label: "UniSuper", abn: "91385943850" },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-t border-border-brand py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right text-fg">{value}</span>
    </div>
  );
}

export default function SuperDemo() {
  const [query, setQuery] = useState("65714394898");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fund, setFund] = useState<Fund | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function run(abn: string) {
    if (!abn.trim()) return;
    setLoading(true);
    setError(null);
    setFund(null);
    const path = `/api/au-super/abn/${encodeURIComponent(abn.trim())}`;
    setLastPath(path);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) setError(data.error || `Request failed (${res.status})`);
      else setFund(data);
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
            placeholder="Super fund ABN, e.g. 65714394898"
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
          disabled={loading || !query.trim()}
          className="btn-primary disabled:opacity-40"
        >
          {loading ? "Looking up..." : "Look up"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.abn}
            type="button"
            onClick={() => {
              setQuery(ex.abn);
              void run(ex.abn);
            }}
            className="rounded-full border border-border-brand px-3 py-1 transition hover:border-brand-green/40 hover:text-fg"
          >
            {ex.label}
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
        {fund && (
          <div className="card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl tracking-tight">{fund.fundName || "Unknown fund"}</h3>
              <span
                className={`inline-flex items-center border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
                  fund.abnStatus?.toLowerCase() === "active"
                    ? "border-brand-green/40 text-brand-green"
                    : "border-border-brand text-muted"
                }`}
              >
                {fund.abnStatus}
              </span>
            </div>
            <div className="mt-5">
              <Row label="ABN" value={fund.abn} />
              {fund.fundType && <Row label="Fund type" value={fund.fundType} />}
              {fund.complyingStatus && <Row label="Complying status" value={fund.complyingStatus} />}
              <Row
                label="Location"
                value={[fund.suburb, fund.state, fund.postcode].filter(Boolean).join(" ") || "n/a"}
              />
            </div>
            {fund.products.length > 0 && (
              <div className="mt-5 border-t border-border-brand pt-4">
                <p className="text-xs uppercase tracking-widest text-muted">
                  Products / USIs ({fund.products.length})
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {fund.products.map((p) => (
                    <div key={p.usi} className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate text-fg">{p.productName}</span>
                      <code className="shrink-0 text-xs text-brand-purple">{p.usi}</code>
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
