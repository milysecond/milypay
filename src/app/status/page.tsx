import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "Status | Milypay",
  description: "Live health of Milypay Australian data APIs and x402 settlement.",
  alternates: { canonical: "/status" },
};

export const dynamic = "force-dynamic";

type StatusPayload = {
  ok?: boolean;
  status?: string;
  checkedAt?: string;
  services?: string[];
  pending?: string[];
  x402?: boolean;
  float?: { usdc?: number };
  receiving?: { audd?: number };
  probes?: { id: string; ok: boolean; status?: number; ms?: number; error?: string }[];
  businessapi?: { configured?: boolean; extracts?: boolean; environment?: string };
};

async function loadStatus(): Promise<StatusPayload> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://milypay.xyz";
    const res = await fetch(`${base}/api/status?deep=1`, {
      next: { revalidate: 30 },
      headers: { accept: "application/json" },
    });
    return (await res.json()) as StatusPayload;
  } catch {
    return { ok: false, status: "error" };
  }
}

export default async function StatusPage() {
  const data = await loadStatus();
  const ok = data.ok === true;
  const label = ok ? "All systems operational" : "Degraded or probing";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="section-label">Status</p>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-fg">Milypay status</h1>
        <p className="mt-4 text-muted">
          Public health for Australian data endpoints and x402 settlement. Deep probe refreshes
          about every 30s.
        </p>

        <div
          className={`mt-10 border p-6 ${
            ok
              ? "border-brand-green/40 bg-brand-green/5"
              : "border-border-brand bg-secondary/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                ok ? "bg-brand-green" : "bg-brand-purple"
              }`}
            />
            <span className="font-display text-xl tracking-tight text-fg">{label}</span>
          </div>
          <p className="mt-2 font-mono text-xs text-muted">
            checked {data.checkedAt || "—"} · x402 {data.x402 ? "on" : "off"}
          </p>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">Live services</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {(data.services || []).map((s) => (
              <li
                key={s}
                className="border border-border-brand bg-card px-4 py-3 font-mono text-sm text-fg"
              >
                {s}
              </li>
            ))}
          </ul>
          {(data.pending || []).length > 0 && (
            <p className="mt-4 text-sm text-muted">
              Pending: {(data.pending || []).join(", ")}
            </p>
          )}
        </section>

        {data.probes && data.probes.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl tracking-tight">Probes</h2>
            <div className="mt-4 overflow-x-auto border border-border-brand">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 font-mono text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">OK</th>
                    <th className="px-4 py-3">HTTP</th>
                    <th className="px-4 py-3">ms</th>
                  </tr>
                </thead>
                <tbody>
                  {data.probes.map((p) => (
                    <tr key={p.id} className="border-t border-border-brand">
                      <td className="px-4 py-3 font-mono text-fg">{p.id}</td>
                      <td className="px-4 py-3">{p.ok ? "✓" : "✗"}</td>
                      <td className="px-4 py-3 font-mono text-muted">{p.status ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-muted">{p.ms ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="border border-border-brand bg-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Payer float</p>
            <p className="mt-2 font-display text-2xl text-fg">
              {data.float?.usdc?.toFixed?.(2) ?? "—"}{" "}
              <span className="text-base text-muted">USDC</span>
            </p>
          </div>
          <div className="border border-border-brand bg-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Received</p>
            <p className="mt-2 font-display text-2xl text-fg">
              {data.receiving?.audd?.toFixed?.(4) ?? "—"}{" "}
              <span className="text-base text-muted">AUDD</span>
            </p>
          </div>
        </section>

        <p className="mt-10 text-sm text-muted">
          JSON:{" "}
          <Link href="/api/status?deep=1" className="text-brand-green hover:underline">
            /api/status?deep=1
          </Link>
          {" · "}
          <Link href="/agents.md" className="text-brand-green hover:underline">
            agents.md
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
