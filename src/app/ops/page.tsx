"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

type OpsData = {
  checkedAt: string;
  x402Enabled: boolean;
  payaiAuth: boolean;
  payTo: string;
  floatPayer: string;
  balances: {
    merchant: { sol: number | null; tokens: Record<string, number> };
    float: { sol: number | null; tokens: Record<string, number> };
  };
  recentTxs: {
    signature: string;
    blockTime?: number | null;
    err?: unknown;
    receiptUrl: string;
  }[];
  probes: { id: string; ok: boolean; status?: number; ms?: number; error?: string }[];
  links: Record<string, string>;
};

function fmtSol(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(4);
}

function fmtTok(n: number | undefined) {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function shortSig(s: string) {
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}

export default function OpsPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<OpsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops", { credentials: "include", cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        setData(null);
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = (await res.json()) as OpsData;
      setData(j);
      setAuthed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      if (!res.ok) {
        setError("Invalid token");
        setAuthed(false);
        return;
      }
      setTokenInput("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "login failed");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/ops", { method: "DELETE", credentials: "include" });
    setAuthed(false);
    setData(null);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Merchant</p>
            <h1 className="font-display mt-2 text-4xl tracking-tight text-fg">Ops</h1>
            <p className="mt-2 text-sm text-muted">
              Internal balances, settlements, and health. Not indexed.
            </p>
          </div>
          {authed && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="border border-border-brand bg-card px-3 py-2 font-mono text-xs text-fg hover:border-brand-green"
                disabled={loading}
              >
                {loading ? "…" : "Refresh"}
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="border border-border-brand bg-card px-3 py-2 font-mono text-xs text-muted hover:text-fg"
              >
                Log out
              </button>
            </div>
          )}
        </div>

        {authed === false && (
          <form onSubmit={login} className="mt-10 max-w-md border border-border-brand bg-card p-6">
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Ops token
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="mt-2 w-full border border-border-brand bg-bg px-3 py-2 font-mono text-sm text-fg outline-none focus:border-brand-green"
              placeholder="OPS_TOKEN"
            />
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="mt-4 bg-brand-green px-4 py-2 font-mono text-sm font-medium text-black disabled:opacity-50"
            >
              Unlock
            </button>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </form>
        )}

        {authed && data && (
          <div className="mt-10 space-y-10">
            <section className="grid gap-3 sm:grid-cols-3">
              <Stat
                label="x402"
                value={data.x402Enabled ? "on" : "off"}
                ok={data.x402Enabled}
              />
              <Stat
                label="PayAI auth"
                value={data.payaiAuth ? "keyed" : "free tier"}
                ok={data.payaiAuth}
              />
              <Stat
                label="Checked"
                value={new Date(data.checkedAt).toLocaleString()}
                ok
              />
            </section>

            <section>
              <h2 className="font-display text-2xl tracking-tight">Merchant wallet</h2>
              <p className="mt-1 break-all font-mono text-xs text-muted">{data.payTo}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Bal label="SOL" value={fmtSol(data.balances.merchant.sol)} />
                {Object.entries(data.balances.merchant.tokens).map(([k, v]) => (
                  <Bal key={k} label={k} value={fmtTok(v)} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl tracking-tight">Float payer</h2>
              <p className="mt-1 break-all font-mono text-xs text-muted">{data.floatPayer}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Bal label="SOL" value={fmtSol(data.balances.float.sol)} />
                {Object.entries(data.balances.float.tokens).map(([k, v]) => (
                  <Bal key={k} label={k} value={fmtTok(v)} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl tracking-tight">Probes</h2>
              <div className="mt-4 overflow-x-auto border border-border-brand">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/50 font-mono text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">OK</th>
                      <th className="px-3 py-2">HTTP</th>
                      <th className="px-3 py-2">ms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.probes.map((p) => (
                      <tr key={p.id} className="border-t border-border-brand">
                        <td className="px-3 py-2 font-mono text-fg">{p.id}</td>
                        <td className="px-3 py-2">{p.ok ? "✓" : "✗"}</td>
                        <td className="px-3 py-2 font-mono text-muted">
                          {p.status ?? p.error ?? "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-muted">{p.ms ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl tracking-tight">Recent merchant txs</h2>
              <ul className="mt-4 divide-y divide-border-brand border border-border-brand">
                {data.recentTxs.length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted">No recent signatures</li>
                )}
                {data.recentTxs.map((tx) => (
                  <li
                    key={tx.signature}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <a
                        href={tx.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-sm text-brand-green hover:underline"
                      >
                        {shortSig(tx.signature)}
                      </a>
                      <p className="mt-0.5 font-mono text-[11px] text-muted">
                        {tx.blockTime
                          ? new Date(tx.blockTime * 1000).toLocaleString()
                          : "—"}
                        {tx.err ? " · err" : ""}
                      </p>
                    </div>
                    <a
                      href={tx.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-muted hover:text-fg"
                    >
                      sol.new/receipt ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-wrap gap-4 text-sm">
              <Link href="/status" className="text-brand-green hover:underline">
                Public status
              </Link>
              <a
                href={data.links.merchantPayai}
                target="_blank"
                rel="noreferrer"
                className="text-brand-green hover:underline"
              >
                PayAI merchant
              </a>
              <a
                href={data.links.payToSolscan}
                target="_blank"
                rel="noreferrer"
                className="text-brand-green hover:underline"
              >
                Solscan payTo
              </a>
            </section>
          </div>
        )}

        {authed && error && <p className="mt-6 text-sm text-red-400">{error}</p>}
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="border border-border-brand bg-card p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-display text-lg ${ok ? "text-fg" : "text-brand-purple"}`}>
        {value}
      </p>
    </div>
  );
}

function Bal({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-brand bg-card px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg text-fg">{value}</p>
    </div>
  );
}
