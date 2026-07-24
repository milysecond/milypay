"use client";

import { useState } from "react";

type Mode = "abn" | "acn" | "name";

interface AbnRecord {
  abn: string;
  abnStatus: string;
  abnStatusFrom: string | null;
  acn: string | null;
  entityName: string | null;
  entityType: string | null;
  businessNames: string[];
  gstRegistered: boolean;
  gstFrom: string | null;
  state: string | null;
  postcode: string | null;
}

interface NameMatch {
  abn: string;
  name: string;
  nameType: string | null;
  abnStatus: string | null;
  state: string | null;
  postcode: string | null;
  score: number | null;
}

const MODES: { key: Mode; label: string; placeholder: string }[] = [
  { key: "abn", label: "ABN", placeholder: "e.g. 33051775556" },
  { key: "acn", label: "ACN", placeholder: "e.g. 051775556" },
  { key: "name", label: "Company name", placeholder: "e.g. Telstra" },
];

const EXAMPLES: { label: string; mode: Mode; q: string }[] = [
  { label: "Telstra", mode: "abn", q: "33051775556" },
  { label: "Woolworths", mode: "abn", q: "88000014675" },
  { label: "ATO", mode: "abn", q: "51824753556" },
  { label: 'Search "qantas"', mode: "name", q: "qantas" },
];

function endpointFor(mode: Mode, q: string): string {
  const v = encodeURIComponent(q.trim());
  if (mode === "abn") return `/api/au-business/abn/${v}`;
  if (mode === "acn") return `/api/au-business/acn/${v}`;
  return `/api/au-business/search?name=${v}&maxResults=8`;
}

function StatusBadge({ status }: { status: string | null }) {
  const active = status?.toLowerCase() === "active";
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
        active ? "border-brand-green/40 text-brand-green" : "border-border-brand text-muted"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-t border-border-brand py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right text-fg">{value}</span>
    </div>
  );
}

export default function DemoClient() {
  const [mode, setMode] = useState<Mode>("abn");
  const [query, setQuery] = useState("33051775556");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entity, setEntity] = useState<AbnRecord | null>(null);
  const [matches, setMatches] = useState<NameMatch[] | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function run(m: Mode, q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setEntity(null);
    setMatches(null);
    const path = endpointFor(m, q);
    setLastPath(path);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
      } else if (m === "name") {
        setMatches(data.matches || []);
      } else {
        setEntity(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function pickExample(ex: (typeof EXAMPLES)[number]) {
    setMode(ex.mode);
    setQuery(ex.q);
    void run(ex.mode, ex.q);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      {/* mode tabs */}
      <div className="inline-flex border border-border-brand bg-card p-1 gap-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`rounded-md px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
              mode === m.key ? "bg-brand-green text-cta-fg" : "text-muted hover:bg-secondary hover:text-fg"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(mode, query);
        }}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={MODES.find((m) => m.key === mode)?.placeholder}
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

      {/* examples */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => pickExample(ex)}
            className="rounded-full border border-border-brand px-3 py-1 transition hover:border-brand-green/40 hover:text-fg"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* request line */}
      {lastPath && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border-brand bg-bg p-3 font-mono text-xs text-muted">
          <span className="text-brand-green">GET</span> https://milypay.xyz{lastPath}
        </div>
      )}

      {/* result */}
      <div className="mt-4">
        {error && (
          <div className="card p-6 text-sm text-brand-purple">{error}</div>
        )}

        {entity && (
          <div className="card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl tracking-tight">
                {entity.entityName || "Unknown entity"}
              </h3>
              <StatusBadge status={entity.abnStatus} />
            </div>
            <div className="mt-5">
              <Row label="ABN" value={entity.abn} />
              {entity.acn && <Row label="ACN" value={entity.acn} />}
              {entity.entityType && <Row label="Entity type" value={entity.entityType} />}
              <Row label="GST registered" value={entity.gstRegistered ? `Yes (from ${entity.gstFrom})` : "No"} />
              <Row
                label="Location"
                value={[entity.state, entity.postcode].filter(Boolean).join(" ") || "n/a"}
              />
              {entity.abnStatusFrom && <Row label="Active since" value={entity.abnStatusFrom} />}
            </div>
            {entity.businessNames.length > 0 && (
              <div className="mt-5 border-t border-border-brand pt-4">
                <p className="text-xs uppercase tracking-widest text-muted">
                  Business names ({entity.businessNames.length})
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entity.businessNames.slice(0, 24).map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-border-brand px-2.5 py-1 text-xs text-fg"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {matches && (
          <div className="flex flex-col gap-3">
            {matches.length === 0 && (
              <div className="card p-6 text-sm text-muted">No matches found.</div>
            )}
            {matches.map((m, i) => (
              <button
                key={`${m.abn}-${i}`}
                type="button"
                onClick={() => {
                  setMode("abn");
                  setQuery(m.abn);
                  void run("abn", m.abn);
                }}
                className="card group flex items-center justify-between gap-4 p-4 text-left transition hover:border-brand-green/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{m.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {m.nameType} · ABN {m.abn} · {[m.state, m.postcode].filter(Boolean).join(" ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={m.abnStatus} />
                  <span className="text-muted transition group-hover:text-brand-green">-&gt;</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
