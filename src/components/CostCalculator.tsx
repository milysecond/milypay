"use client";

import { useMemo, useState } from "react";

const AVG_PRICE = 0.002; // AUDD per call (typical Milypay price)
const TRADITIONAL_SETUP = 200; // rough monthly API seat / key / support friction
const FX_FRICTION_PCT = 0.015; // USD round-trip friction proxy

function formatAud(n: number): string {
  if (n < 1) return `$${n.toFixed(3)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString("en-AU")}`;
}

export default function CostCalculator() {
  const [calls, setCalls] = useState(50_000);

  const math = useMemo(() => {
    const milypay = calls * AVG_PRICE;
    const traditional = TRADITIONAL_SETUP + milypay * (1 + FX_FRICTION_PCT) * 1.4;
    const saved = Math.max(0, traditional - milypay);
    const pct = traditional > 0 ? (saved / traditional) * 100 : 0;
    return { milypay, traditional, saved, pct };
  }, [calls]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border-brand px-6 py-5 sm:px-8">
        <p className="eyebrow">Estimate agent spend</p>
        <h2 className="font-display mt-1 text-2xl sm:text-3xl">
          What does per-call Australia cost?
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Typical Milypay price is ~$0.002 AUDD per call. No seats, no FX bridge, no monthly minimum.
        </p>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <label htmlFor="calls" className="text-sm font-medium text-fg">
              Monthly agent API calls
            </label>
            <span className="font-mono text-sm font-semibold tabular-nums text-fg">
              {calls.toLocaleString("en-AU")}
            </span>
          </div>
          <input
            id="calls"
            type="range"
            min={1000}
            max={500000}
            step={1000}
            value={calls}
            onChange={(e) => setCalls(Number(e.target.value))}
            className="mt-4 w-full accent-[var(--cta)]"
            aria-valuemin={1000}
            aria-valuemax={500000}
            aria-valuenow={calls}
          />
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>1k</span>
            <span>250k</span>
            <span>500k</span>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm">
              <span className="text-muted">Legacy stack (keys + FX + seats)</span>
              <span className="font-medium tabular-nums text-fg">
                {formatAud(math.traditional)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm">
              <span className="text-muted">Milypay metered (AUDD)</span>
              <span className="font-medium tabular-nums text-brand-green">
                {formatAud(math.milypay)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border-brand bg-cream px-4 py-3 text-sm">
              <span className="font-medium text-fg">You keep</span>
              <span className="font-semibold tabular-nums text-fg">
                {formatAud(math.saved)}
                <span className="ml-2 text-xs font-normal text-muted">
                  ({math.pct.toFixed(0)}% less)
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-cta p-6 text-cta-fg sm:p-7">
          <div>
            <p className="text-sm text-white/60">Monthly Milypay spend</p>
            <p className="font-display mt-2 text-4xl tabular-nums sm:text-5xl">
              {formatAud(math.milypay)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Settled per request in AUDD. Demo endpoints on milypay.xyz stay free to try;
              production traffic on api.milypay.xyz pays via x402.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1.5">No API keys</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">No FX bridge</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">AUD-native</span>
          </div>
        </div>
      </div>
    </div>
  );
}
