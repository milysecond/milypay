import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "AUD Stablecoins - settlement options | Milypay",
  description:
    "Milypay settles agent payments in regulated AUD stablecoins. A reference to the options - AUDD, AUDM, dAUD and more - and how Milypay routes settlement.",
  alternates: { canonical: "/stables" },
};

type Status = "live" | "planned" | "emerging" | "legacy";

const STATUS_STYLE: Record<Status, string> = {
  live: "border-brand-green/40 text-brand-green",
  planned: "border-brand-purple/40 text-brand-purple",
  emerging: "border-border-brand text-muted",
  legacy: "border-border-brand text-muted",
};

const STABLES: {
  ticker: string;
  name: string;
  issuer: string;
  regulatory: string;
  chains: string;
  solana: string;
  status: Status;
  statusLabel: string;
  desc: string;
}[] = [
  {
    ticker: "AUDD",
    name: "Australian Digital Dollar",
    issuer: "AUDC Pty Ltd",
    regulatory: "AFSL-licensed (ASIC, Feb 2026)",
    chains: "Ethereum, Solana, Stellar, XRPL, Base, Hedera, XDC, Redbelly",
    solana: "Live",
    status: "live",
    statusLabel: "Flagship · Live on Solana",
    desc: "The market leader and first AUD stablecoin listed on Coinbase. Fully reserved 1:1 via bare trust. Milypay's default settlement asset today, via the PayAI facilitator.",
  },
  {
    ticker: "AUDM",
    name: "AUDM",
    issuer: "Macropod",
    regulatory: "Australia's first standalone stablecoin licence (ASIC, Sep 2025)",
    chains: "Ethereum, Solana, Base, Redbelly",
    solana: "Live",
    status: "live",
    statusLabel: "Institutional · Live on Solana",
    desc: "Built for settlement infrastructure, tokenised assets, and wholesale markets. Accepted for Milypay x402 settlement on Solana (mint CiYXBwHPrdNkMtxR8YEWKv78K6bQjFoEWhPQrZqEmubi).",
  },
  {
    ticker: "dAUD",
    name: "dAUD",
    issuer: "New Money",
    regulatory: "Protocol / issuer disclosure",
    chains: "Solana",
    solana: "Live",
    status: "live",
    statusLabel: "Live on Solana",
    desc: "On-chain AUD unit for settlement. Accepted for Milypay x402 settlement on Solana (mint F7FiKutfrMMXd8Zw5ysZsfx5v4aBHffWc4EhRZE8NHiF, 9 decimals).",
  },
  {
    ticker: "A$DC",
    name: "ANZ A$DC",
    issuer: "ANZ Bank",
    regulatory: "Bank-issued",
    chains: "Ethereum",
    solana: "-",
    status: "legacy",
    statusLabel: "Bank-issued · Institutional",
    desc: "The first AUD-backed stablecoin minted by an Australian bank (2022), used for institutional tokenised-asset settlement. Included for completeness.",
  },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-fg">{value}</dd>
    </div>
  );
}

export default function StablesPage() {
  return (
    <main className="flex-1">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-brand">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
            Settlement
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.08] tracking-tight md:text-6xl">
            Settled in <span className="brand-gradient-text">AUD stablecoins</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Milypay is stablecoin-agnostic. Agents pay for Australian data and settle in a
            regulated, AUD-denominated stablecoin - no bridging through USD, no FX. AUDD is
            live today; as new AUD stables reach Solana, Milypay routes to them automatically.
          </p>
        </div>
      </section>

      {/* Why AUD stables */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "AUD-native, not USD-bridged",
              d: "x402 runs on USDC by default. AUD stables remove the FX round-trip for Australian builders, users, and agents.",
            },
            {
              t: "Regulated & reserved",
              d: "Issued under Australian licences (AFSL / standalone stablecoin licences), 1:1 backed - the compliance agents need to transact.",
            },
            {
              t: "One rail, many issuers",
              d: "Milypay abstracts the asset. Price in AUD; settle in whichever AUD stablecoin the counterparty holds.",
            },
          ].map((x) => (
            <div key={x.t} className="card p-6">
              <h3 className="font-display text-lg tracking-tight">{x.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The options */}
      <section className="border-y border-border-brand bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl tracking-tight md:text-4xl">
              The AUD stablecoin landscape.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              A living reference. Milypay supports regulated AUD stables as they become
              available on Solana - this list grows as the market does.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {STABLES.map((s) => (
              <div key={s.ticker} className="card p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-2xl tracking-tight">{s.ticker}</span>
                    <span className="text-sm text-muted">{s.name}</span>
                  </div>
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLE[s.status]}`}
                  >
                    {s.statusLabel}
                  </span>
                </div>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{s.desc}</p>
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border-brand pt-6 md:grid-cols-4">
                  <Field label="Issuer" value={s.issuer} />
                  <Field label="Regulatory" value={s.regulatory} />
                  <Field label="Chains" value={s.chains} />
                  <Field label="On Solana" value={s.solana} />
                </dl>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs leading-relaxed text-muted">
            Informational only - not financial advice or an endorsement of any issuer. AUDN
            (NAB) is omitted as discontinued. Details current as of mid-2026 and subject to
            change; new AUD stablecoins will be added as they launch. Milypay provides
            settlement and data services, not currency issuance.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="card relative overflow-hidden p-10 text-center md:p-14">
          <div className="hero-glow absolute inset-0 -z-10" />
          <h2 className="font-display mx-auto max-w-2xl text-3xl tracking-tight md:text-4xl">
            Issue an AUD stablecoin? Let&rsquo;s get it on the agent rail.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">
            Milypay is the AUD-native settlement layer for x402. If you want your stablecoin
            routable by agents across the Pay.sh catalog, talk to us.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact?topic=stablecoin"
              className="btn-primary"
            >
              Talk to us
            </Link>
            <Link
              href="/#audd"
              className="rounded-full border border-border-brand bg-bg px-6 py-3 text-sm font-semibold text-fg transition hover:border-brand-green/40"
            >
              Why AUDD
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
