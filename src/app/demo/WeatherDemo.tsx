"use client";

import { useState } from "react";

interface Day {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitation: number | null;
  weather: string;
}
interface Forecast {
  location: { address?: string; lat: number; lng: number; timezone: string };
  current: {
    temperature: number | null;
    apparentTemperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    weather: string;
  };
  daily: Day[];
}

const EXAMPLES = [
  "120 collins st melbourne",
  "1 bligh st sydney",
  "200 adelaide st brisbane",
];

function dayName(iso: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [y, m, d] = iso.split("-").map(Number);
  // Zeller-free: use Date in UTC (display only)
  const idx = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return days[idx] ?? iso;
}

export default function WeatherDemo() {
  const [query, setQuery] = useState("120 collins st melbourne");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Forecast | null>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function run(q: string) {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setData(null);
    const path = `/api/au-weather?q=${encodeURIComponent(q.trim())}&days=5`;
    setLastPath(path);
    try {
      const res = await fetch(path);
      const json = await res.json();
      if (!res.ok) setError(json.error || `Request failed (${res.status})`);
      else setData(json);
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
            placeholder="Australian address for the forecast"
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
          disabled={loading || query.trim().length < 2}
          className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Loading..." : "Forecast"}
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
        <div className="mt-6 overflow-x-auto rounded-lg border border-border-brand bg-bg p-3 font-mono text-xs text-muted">
          <span className="text-brand-green">GET</span> https://milypay.xyz{lastPath}
        </div>
      )}

      <div className="mt-4">
        {error && <div className="card p-6 text-sm text-brand-purple">{error}</div>}
        {data && (
          <div className="card p-6 md:p-8">
            <p className="text-sm text-muted">{data.location.address || `${data.location.lat}, ${data.location.lng}`}</p>
            <div className="mt-3 flex items-end gap-4">
              <span className="font-display text-5xl tracking-tight">
                {data.current.temperature != null ? Math.round(data.current.temperature) : "--"}
                <span className="text-2xl text-muted">&deg;C</span>
              </span>
              <span className="pb-2 text-lg text-brand-green">{data.current.weather}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Feels {data.current.apparentTemperature != null ? Math.round(data.current.apparentTemperature) : "--"}&deg;
              {data.current.humidity != null ? ` · ${data.current.humidity}% humidity` : ""}
              {data.current.windSpeed != null ? ` · ${Math.round(data.current.windSpeed)} km/h wind` : ""}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border-brand pt-5 sm:grid-cols-5">
              {data.daily.map((d) => (
                <div key={d.date} className="text-center">
                  <div className="text-xs uppercase tracking-wide text-muted">{dayName(d.date)}</div>
                  <div className="mt-1 text-sm font-medium text-fg">
                    {d.tempMax != null ? Math.round(d.tempMax) : "--"}&deg;
                    <span className="text-muted"> / {d.tempMin != null ? Math.round(d.tempMin) : "--"}&deg;</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-tight text-muted">{d.weather}</div>
                  {d.precipitation != null && d.precipitation > 0 && (
                    <div className="mt-0.5 text-[11px] text-brand-purple">{d.precipitation} mm</div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted">
              Weather by Open-Meteo.com (CC BY 4.0). Australian model: BOM ACCESS-G.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
