"use client";

import { useState } from "react";

interface Service {
  code: string;
  name: string;
  price: number;
  deliveryTime: string | null;
}

export default function PostageDemo() {
  const [mode, setMode] = useState<"domestic" | "international">("domestic");
  const [from, setFrom] = useState("3000");
  const [to, setTo] = useState("2000");
  const [country, setCountry] = useState("US");
  const [weight, setWeight] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setServices(null);
    const path =
      mode === "international"
        ? `/api/au-postage?country=${encodeURIComponent(country)}&weight=${encodeURIComponent(weight)}`
        : `/api/au-postage?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&weight=${encodeURIComponent(weight)}`;
    setLastPath(path);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) setError(data.error || `Request failed (${res.status})`);
      else setServices(data.services || []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const field = (label: string, value: string, set: (v: string) => void, ph: string) => (
    <label className="flex-1">
      <span className="text-xs text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={ph}
        className="mt-1 w-full rounded-full border border-border-brand bg-card px-4 py-2.5 text-fg outline-none placeholder:text-muted/50 focus:border-brand-green"
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <div className="mb-4 inline-flex rounded-full border border-border-brand bg-card p-1">
          {(["domestic", "international"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                mode === m ? "bg-brand-green text-bg" : "text-muted hover:text-fg"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {mode === "domestic" ? (
            <>
              {field("From postcode", from, setFrom, "3000")}
              {field("To postcode", to, setTo, "2000")}
            </>
          ) : (
            field("Country code", country, setCountry, "US")
          )}
          {field("Weight (kg)", weight, setWeight, "1")}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Calculating…" : "Calculate postage"}
        </button>
      </form>

      {lastPath && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border-brand bg-bg p-3 font-mono text-xs text-muted">
          <span className="text-brand-green">GET</span> https://milypay.xyz{lastPath}
        </div>
      )}

      <div className="mt-4">
        {error && <div className="card p-6 text-sm text-brand-purple">{error}</div>}
        {services && (
          <div className="card p-2">
            {services.length === 0 && <p className="p-4 text-sm text-muted">No services found.</p>}
            {services.map((s) => (
              <div
                key={s.code}
                className="flex items-center justify-between gap-4 border-b border-border-brand px-4 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{s.name}</p>
                  <p className="truncate text-[11px] text-muted">{s.code}</p>
                </div>
                <span className="shrink-0 font-display text-lg text-brand-green">
                  ${s.price.toFixed(2)}
                </span>
              </div>
            ))}
            <p className="px-4 py-2 text-xs text-muted">Source: Australia Post (PAC).</p>
          </div>
        )}
      </div>
    </div>
  );
}
