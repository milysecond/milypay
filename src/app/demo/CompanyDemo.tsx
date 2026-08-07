"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "acn" | "name";

const ASIC_COMPANY_SEARCH =
  "https://connectonline.asic.gov.au/RegistrySearch/faces/landing/SearchRegisters.jspx";
const ASIC_ABOUT =
  "https://www.asic.gov.au/online-services/search-asic-registers/company-and-organisation-registers/";

interface Company {
  acn: string;
  abn: string | null;
  name: string;
  status: string;
  type: string | null;
  class: string | null;
  registrationDate: string | null;
  deregistrationDate: string | null;
  previousState: string | null;
  formerNames: string[];
}
interface Match {
  acn: string;
  name: string;
  status: string;
  formerName: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const ok = status.toLowerCase() === "registered";
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
        ok ? "border-brand-green/40 text-brand-green" : "border-border-brand text-muted"
      }`}
    >
      {status}
    </span>
  );
}

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex justify-between gap-6 border-t border-border-brand py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-right text-brand-green hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="text-right text-fg">{value}</span>
      )}
    </div>
  );
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export default function CompanyDemo({ initialAcn }: { initialAcn?: string | null }) {
  const seed = initialAcn ? digitsOnly(initialAcn) : "";
  const [mode, setMode] = useState<Mode>(seed ? "acn" : "name");
  const [query, setQuery] = useState(seed || "woolworths group");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractMeta, setExtractMeta] = useState<{
    requestId: string | number;
    status: string;
    type: string;
    pdfBytes?: number;
    demo?: boolean;
  } | null>(null);
  const ranSeed = useRef<string | null>(null);

  async function run(m: Mode, q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setCompany(null);
    setMatches(null);
    setExtractMeta(null);
    setExtractError(null);
    const path =
      m === "acn"
        ? `/api/au-company/acn/${encodeURIComponent(q.trim())}`
        : `/api/au-company/search?name=${encodeURIComponent(q.trim())}&limit=8`;
    setLastPath(path);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) setError(data.error || `Request failed (${res.status})`);
      else if (m === "acn") setCompany(data);
      else setMatches(data.matches || []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function orderExtract(acn: string) {
    setExtractLoading(true);
    setExtractError(null);
    setExtractMeta(null);
    const path = `/api/au-company-report?acn=${encodeURIComponent(acn)}&type=current`;
    setLastPath(path);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) {
        setExtractError(data.error || `Extract failed (${res.status})`);
        return;
      }
      setExtractMeta({
        requestId: data.requestId,
        status: data.status,
        type: data.type || "current",
        pdfBytes: data.pdfBytes,
        demo: data.demo === true || data.environment === "test",
      });
      if (data.pdfBase64) {
        const bin = atob(data.pdfBase64 as string);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `asic-extract-${acn}-current.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setExtractError("Network error ordering extract.");
    } finally {
      setExtractLoading(false);
    }
  }

  // Auto-lookup when opened via deeplink (?tab=company&acn=...).
  useEffect(() => {
    if (!seed || seed.length === 0) return;
    if (ranSeed.current === seed) return;
    ranSeed.current = seed;
    setMode("acn");
    setQuery(seed);
    void run("acn", seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed-driven auto lookup once
  }, [seed]);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <div className="inline-flex gap-1 border border-border-brand bg-card p-1">
        {(["acn", "name"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
              mode === m ? "bg-brand-green text-cta-fg" : "text-muted hover:bg-secondary hover:text-fg"
            }`}
          >
            {m === "acn" ? "ACN" : "Company name"}
          </button>
        ))}
      </div>

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
            placeholder={mode === "acn" ? "e.g. 000014675" : "e.g. Woolworths Group"}
            className="w-full rounded-md border border-border-brand bg-card px-5 py-3 pr-11 text-fg outline-none placeholder:text-muted/50 focus:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-secondary hover:text-fg"
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

      <p className="mt-3 text-xs text-muted">
        Open data snapshot for agents. For official extracts and register search, use{" "}
        <a
          href={ASIC_COMPANY_SEARCH}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-green hover:underline"
        >
          ASIC company search
        </a>
        {" "}
        (
        <a
          href={ASIC_ABOUT}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          about company &amp; organisation registers
        </a>
        ).
      </p>

      {lastPath && (
        <div className="mt-6 max-w-full min-w-0 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border-brand bg-bg p-3 font-mono text-[11px] leading-relaxed text-muted [overflow-wrap:anywhere] sm:text-xs">
          <span className="text-brand-green">GET</span> https://milypay.xyz{lastPath}
        </div>
      )}

      <div className="mt-4">
        {error && <div className="card p-6 text-sm text-brand-purple">{error}</div>}

        {company && (
          <div className="card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl tracking-tight">{company.name}</h3>
              <StatusBadge status={company.status} />
            </div>
            <div className="mt-5">
              <Row label="ACN" value={company.acn} href={ASIC_COMPANY_SEARCH} />
              {company.abn && <Row label="ABN" value={company.abn} />}
              {company.type && <Row label="Type" value={company.type} />}
              {company.class && <Row label="Class" value={company.class} />}
              {company.registrationDate && <Row label="Registered" value={company.registrationDate} />}
              {company.deregistrationDate && (
                <Row label="Deregistered" value={company.deregistrationDate} />
              )}
            </div>
            {company.formerNames.length > 0 && (
              <div className="mt-5 border-t border-border-brand pt-4">
                <p className="text-xs uppercase tracking-widest text-muted">Former names</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {company.formerNames.map((n) => (
                    <span key={n} className="rounded-full border border-border-brand px-2.5 py-1 text-xs text-fg">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 border-t border-border-brand pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={extractLoading}
                  onClick={() => void orderExtract(company.acn)}
                  className="btn-primary disabled:opacity-40"
                >
                  {extractLoading ? "Ordering extract..." : "Get ASIC company extract (sandbox)"}
                </button>
                <p className="text-xs text-muted">
                  Official extract via <code className="text-fg">/au-company-report</code>. This
                  site uses Business API <strong>test</strong> keys (free sandbox PDF). Live
                  extracts: <code className="text-fg">api.milypay.xyz</code> · $12 · x402.
                </p>
              </div>
              {extractError && (
                <p className="mt-3 text-sm text-brand-purple">{extractError}</p>
              )}
              {extractMeta && (
                <div className="mt-3 rounded-md border border-border-brand bg-bg p-3 font-mono text-xs text-muted">
                  <p>
                    status <span className="text-fg">{extractMeta.status}</span>
                    {" · "}
                    requestId <span className="text-fg">{String(extractMeta.requestId)}</span>
                    {" · "}
                    type <span className="text-fg">{extractMeta.type}</span>
                    {extractMeta.pdfBytes != null && (
                      <>
                        {" · "}
                        pdf <span className="text-fg">{extractMeta.pdfBytes}</span> bytes
                      </>
                    )}
                  </p>
                  {extractMeta.demo && (
                    <p className="mt-1 text-brand-green">Sandbox demo extract downloaded</p>
                  )}
                </div>
              )}
            </div>
            <p className="mt-5 border-t border-border-brand pt-4 text-xs text-muted">
              Verify on{" "}
              <a
                href={ASIC_COMPANY_SEARCH}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-green hover:underline"
              >
                ASIC company search
              </a>
              .
            </p>
          </div>
        )}

        {matches && (
          <div className="flex flex-col gap-3">
            {matches.length === 0 && <div className="card p-6 text-sm text-muted">No matches found.</div>}
            {matches.map((m, i) => (
              <button
                key={`${m.acn}-${i}`}
                type="button"
                onClick={() => {
                  setMode("acn");
                  setQuery(m.acn);
                  void run("acn", m.acn);
                }}
                className="card group flex items-center justify-between gap-4 p-4 text-left transition hover:border-brand-green/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{m.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    ACN {m.acn}
                    {m.formerName ? " · former name" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={m.status} />
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
