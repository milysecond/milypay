import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site";
import CodeBlock from "@/components/CodeBlock";
import CostCalculator from "@/components/CostCalculator";

const SERVICES: {
  tag: string;
  title: string;
  desc: string;
  price: string;
  soon?: boolean;
}[] = [
  {
    tag: "au-business",
    title: "Business identity",
    desc: "ABN / ACN lookup, ASIC company data, director and entity verification — agent-grade KYB for Australian businesses.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-company",
    title: "Company register",
    desc: "ASIC company lookup by ACN or name — status, type, class, registration dates, and former names. 3.9M companies.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-company-report",
    title: "ASIC company report",
    desc: "Official ASIC extract: directors, secretaries, shareholders, charges, registered office. Not in free open data; paid DSP only. Basic ACN/name lookups stay free-gov.",
    price: "from $12 / extract",
  },
  {
    tag: "au-address",
    title: "Property & address",
    desc: "GNAF address validation, geocoding, and property data. Clean Australian addresses, resolved on demand.",
    price: "from $0.004 / call",
  },
  {
    tag: "au-super",
    title: "Super Fund Lookup",
    desc: "Verify any Australian super fund by ABN — fund name, status, type, complying status, and USIs, from the ATO register.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-weather",
    title: "Weather",
    desc: "Current conditions and multi-day forecast for any Australian address or coordinate. BOM ACCESS-G model via Open-Meteo.",
    price: "from $0.001 / call",
  },
  {
    tag: "au-postage",
    title: "Postage",
    desc: "Australia Post parcel rates and service options between any two postcodes, domestic or international. Powered by the AusPost PAC.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-bsb",
    title: "BSB lookup",
    desc: "Validate any BSB and get bank name, branch, address, and payment methods. 17,000+ BSBs from AusPayNet.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-transit",
    title: "Public transport",
    desc: "Live GTFS-Realtime vehicles, delays, and alerts — Translink SEQ, Adelaide Metro, Victoria, and NSW (buses/trains/metro/ferries/light rail).",
    price: "from $0.001 / call",
  },
  {
    tag: "au-abs",
    title: "ABS statistics",
    desc: "Australian Bureau of Statistics via SDMX — CPI, wages, population, census, retail and 1,200+ dataflows. Headline CPI with QoQ/YoY built in.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-tracking",
    title: "Parcel tracking",
    desc: "Track an Australia Post parcel by tracking number — status and full event history.",
    price: "Coming soon",
    soon: true,
  },
  {
    tag: "au-money",
    title: "Money & FX",
    desc: "AUD reference rates, RBA data, and AUD-denominated settlement — the currency layer agents need locally.",
    price: "from $0.001 / call",
  },
  {
    tag: "au-civic",
    title: "Civic & gov",
    desc: "data.gov.au, electoral and transport feeds (GTFS realtime). Australia's open data, agent-ready.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-settle",
    title: "AUD settlement",
    desc: "x402 facilitation settled in AUD stablecoin. Every call authorised, metered, and paid per request.",
    price: "0.5% of settled volume",
  },
];

const WHY_AUDD = [
  {
    title: "1:1 AUD-backed & AFSL-regulated",
    desc: "Stable, compliant settlement — not volatile crypto. AUDD is fully backed under an AFSL framework.",
  },
  {
    title: "Programmable money",
    desc: "Quoting, escrow, splits, and refunds run on-chain — no human in the loop for each call.",
  },
  {
    title: "Multi-chain, Solana-first",
    desc: "Agents already operate on Solana. Milypay settles there for ~1-second finality.",
  },
  {
    title: "Onchain AUD, zero FX friction",
    desc: "x402 is dominated by USDC. AUDD is the AUD-native option — stop bridging through USD.",
  },
];

const ECOSYSTEM = [
  { stat: "72+", label: "services on Pay.sh" },
  { stat: "1,000+", label: "companies in PayAI" },
  { stat: "~1s", label: "settlement finality" },
  { stat: "10 min", label: "to accept AUDD" },
];

const ACCESS = [
  {
    tag: "CLI",
    title: "Command line",
    desc: "Hit any endpoint from your terminal. Free demo by default; paid API with MILYPAY_PRIVATE_KEY.",
    code: "npx milypay abn 51824753556",
  },
  {
    tag: "SDK",
    title: "TypeScript & Python",
    desc: "Drop-in x402 client. Wrap fetch, get auto-paid responses — no manual payment plumbing.",
    code: 'import { Milypay } from "milypay-sdk";\nconst au = new Milypay({ wallet });\nawait au.business.abn("51824753556");',
  },
  {
    tag: "MCP",
    title: "Model Context Protocol",
    desc: "First-party MCP server. Typed tools for ABN, ASIC, address, weather, BSB, ABS CPI — drop into Claude or Cursor.",
    code: '// claude / cursor mcp config\n{ "milypay": { "command": "npx", "args": ["-y", "milypay", "mcp"], "env": { "MILYPAY_HOST": "demo" } } }',
  },
  {
    tag: "API",
    title: "Raw HTTP 402",
    desc: "No SDK required. Any x402-aware client speaks directly to the endpoint and settles in AUD.",
    code: "curl https://api.milypay.xyz/au-business/abn/51824753556",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Agent requests data",
    desc: "Hit a Milypay endpoint for Australian data — no API key, no signup.",
  },
  {
    n: "02",
    title: "402 Payment Required",
    desc: "Milypay answers with price, asset (AUDD), and pay-to address.",
  },
  {
    n: "03",
    title: "Pay & receive",
    desc: "Wallet approves the micropayment. Data returns in the same round-trip.",
  },
];

const AGENT_SYSTEM_PROMPT = `You can use Milypay, free Australian data APIs at https://api.milypay.xyz (no API key needed). Make a GET request and read the JSON:
- Australian business by ABN: /au-business/abn/{abn}
- Business by ACN: /au-business/acn/{acn}
- Business name search: /au-business/search?name={name}
- Company (ASIC open data) by ACN: /au-company/acn/{acn}
- Company name search: /au-company/search?name={name}
- Official ASIC extract (paid; not free gov data): /au-company-report?acn={acn}
- Super fund by ABN: /au-super/abn/{abn}
- Validate or geocode an address: /au-address/validate?q={address}
- Weather for an address: /au-weather?q={address}
- Postage between postcodes: /au-postage?from={from}&to={to}&weight={kg}
- BSB lookup: /au-bsb/{bsb}
- ABS dataflow search: /au-abs/dataflows?q={query}
- ABS headline CPI: /au-abs/cpi
- ABS series data: /au-abs/data/{dataflow}?key={key}&startPeriod={period}
- Transit vehicles: /au-transit/seq/vehicles
- Transit alerts: /au-transit/sa/alerts
Full reference: https://milypay.xyz/agents.md`;

const AGENT_ONELINER = `Use the Milypay APIs at https://api.milypay.xyz for Australian business, address, super fund, weather, BSB, and ABS statistics data. Read https://milypay.xyz/agents.md first, then call the endpoints with a GET request and read the JSON.`;

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Milypay?",
    a: "Milypay is the x402 service provider for the Australian market. It gives AI agents pay-per-call access to Australian data — business identity, company register, addresses, super funds, weather, postage, BSB, ABS statistics, and public transport — settled in AUDD, the regulated AUD-native stablecoin, with no API keys and no signup. Milypay is a Milysec company.",
  },
  {
    q: "How do AI agents pay for Australian data on Milypay?",
    a: "Agents use the x402 protocol. An agent requests an endpoint, receives an HTTP 402 Payment Required response with the price in AUDD, approves the micropayment from an x402-aware wallet, and the data returns in the same round-trip. It works through the Milypay CLI, an SDK, the Milypay MCP server, or raw HTTP.",
  },
  {
    q: "What is x402?",
    a: "x402 is an open protocol that turns the HTTP 402 Payment Required status code into a real payment rail, letting a client pay for an API call inline. Milypay uses x402 so AI agents can pay per request, settling in AUD stablecoins on Solana via the PayAI facilitator.",
  },
  {
    q: "Do I need an API key or account to use Milypay?",
    a: "No. Milypay has no accounts, no API keys, and no signup. Any x402-aware client pays per call and receives the data back in the same request.",
  },
  {
    q: "What is AUDD and why does Milypay settle in it?",
    a: "Milypay settles agent payments in AUD on Solana. Accepted AUD stables: AUDD (Novatti), AUDM (Macropod), and dAUD (New Money). USDC and USDT are also accepted for pay.sh compatibility. AUD settlement avoids the USD foreign-exchange round-trip that USDC-only x402 services require.",
  },
  {
    q: "How do I give my AI agent access to Australian data?",
    a: "Point your agent at https://milypay.xyz/agents.md, or add the Milypay MCP server to Claude, ChatGPT, Cursor, or any MCP-compatible client. The agent can then discover, price, and call every Milypay service. You can also paste the ready-made Milypay prompt from the home page.",
  },
  {
    q: "What Australian data does Milypay provide?",
    a: "Business identity (ABN and ACN lookup from the ABR), ASIC company register lookups, address validation and geocoding (G-NAF, 16.9M addresses), super fund lookup, weather (BOM ACCESS-G via Open-Meteo), Australia Post postage rates, BSB lookup (17,000+ BSBs from AusPayNet), ABS statistics (CPI, wages, population, census and 1,200+ SDMX dataflows), and live public transport (QLD/SA GTFS-RT). More Australian services are on the roadmap.",
  },
  {
    q: "Which AI tools and agents work with Milypay?",
    a: "Any agent or assistant that can make an HTTP request: Claude, ChatGPT, Cursor, and any Model Context Protocol client via the Milypay MCP server. If your agent can call a URL, it can use Milypay.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const TRUST = [
  { name: "x402", chip: "Protocol" },
  { name: "PayAI", chip: "Facilitator" },
  { name: "pay.sh", chip: "Catalog" },
  { name: "AUDD", chip: "Stablecoin" },
  { name: "Solana", chip: "Settlement" },
  { name: "Milysec", chip: "Studio" },
  { name: "ASIC open data", chip: "Source" },
  { name: "G-NAF", chip: "Source" },
];

function PaymentMock() {
  return (
    <div className="relative">
      <div className="lab-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-brand px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-border-brand" />
            <span className="h-2 w-2 rounded-full bg-border-brand" />
            <span className="h-2 w-2 rounded-full bg-brand-green" />
          </div>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            api.milypay.xyz
          </span>
        </div>
        <div className="space-y-4 p-5 font-mono text-[12px] leading-relaxed sm:p-6 sm:text-[13px]">
          <div className="text-muted">
            <span className="text-brand-green">$</span> curl /au-business/abn/51824753556
          </div>
          <div className="border border-border-brand bg-secondary p-4">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              Challenge
            </div>
            <div className="mt-2 text-brand-purple">HTTP/1.1 402 Payment Required</div>
            <div className="mt-2 space-y-0.5 text-muted">
              <div>price &nbsp;&nbsp; 0.002 AUDD</div>
              <div>network &nbsp;solana</div>
              <div>pay-to &nbsp; milypay.sol</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <span className="inline-flex h-5 w-5 items-center justify-center border border-brand-green/30 bg-brand-green/10 text-[10px] font-bold text-brand-green">
              ✓
            </span>
            <span>wallet approves · PayAI settles</span>
          </div>
          <div className="border border-brand-green/25 bg-brand-green/5 p-4">
            <div className="text-brand-green">HTTP/1.1 200 OK</div>
            <pre className="mt-2 whitespace-pre-wrap text-fg">{`{
  "abn": "51824753556",
  "entityName": "MILYSEC PTY LTD",
  "status": "Active",
  "state": "VIC"
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />

      {/* Hero */}
      <section className="hero-wash relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 lab-grid opacity-40 dark:opacity-30" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-16 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:pb-24 md:pt-20">
          <div>
            <p className="section-label mb-5">x402 · Australia · AUDD</p>

            <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-fg sm:text-5xl md:text-[3.5rem]">
              Keep agent spend{" "}
              <span className="text-brand-green">in AUD</span>
              <span className="block">on every call.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Milypay gives AI agents pay-per-call access to Australian data — business,
              address, weather, postage — settled in AUDD. No keys. No signup. Just 402.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className="btn-mono-solid">
                Try it live
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a href="#developers" className="btn-mono">
                Start building
              </a>
            </div>

            <p className="terminal-line mt-6">
              <span className="prompt">$</span> request → 402 → settle AUDD → data
            </p>
          </div>

          <PaymentMock />
        </div>
      </section>

      {/* Proof density wall */}
      <section className="border-y border-border-brand">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Stack · rails · sources
          </p>
          <div className="grid grid-cols-2 border-l border-t border-border-brand sm:grid-cols-4">
            {TRUST.map((t) => (
              <div
                key={t.name}
                className="partner-cell !min-h-[4rem] !rounded-none border-b border-r !border-t-0 !border-l-0"
              >
                <span className="absolute right-2 top-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted/70">
                  {t.chip}
                </span>
                <span className="font-display text-sm tracking-tight sm:text-base">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="border-b border-border-brand bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <CostCalculator />
        </div>
      </section>

      {/* The gap + stats */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="section-label">The gap</p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              Every x402 provider is global.
              <br className="hidden sm:block" />
              None of them own Australia.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-muted">
              The pay.sh catalog is full of horizontal providers — crypto data, email, OCR,
              search. None speak Australian. No ABN lookup, no GNAF addresses, no BOM weather,
              no AUD rail. Milypay is the local layer for agents operating here.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px border border-border-brand bg-border-brand">
            {[
              ["74", "providers on pay.sh"],
              ["0", "serving Australia — until now"],
              ["1", "namespace: milysec/*"],
              ["AUD", "native settlement"],
            ].map(([stat, label]) => (
              <div key={label} className="bg-card p-5">
                <div className="font-display text-3xl tracking-tight text-fg">{stat}</div>
                <div className="mt-1 text-sm text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-y border-border-brand bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="max-w-2xl">
            <p className="section-label">Services</p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              Australian data, priced per call — in AUDD.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Endpoints under the <code className="text-fg">milysec/*</code> namespace, listed
              on Pay.sh. Metered, pay-as-you-go, settled in AUDD.
            </p>
          </div>

          <div className="mt-12 grid gap-px border border-border-brand bg-border-brand sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <div
                key={s.tag}
                className="flex flex-col bg-card p-6 transition-colors hover:bg-secondary/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-[11px] text-brand-purple">milysec/{s.tag}</code>
                  <span className="fig-label">FIG.{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg tracking-tight">{s.title}</h3>
                  {s.soon && (
                    <span className="shrink-0 border border-border-brand px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Soon
                    </span>
                  )}
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.desc}</p>
                <div
                  className={`mt-5 border-t border-border-brand pt-4 font-mono text-xs tracking-wide ${
                    s.soon ? "text-muted" : "text-brand-green"
                  }`}
                >
                  {s.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="section-label">How it works</p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              Same request for agents.
              <br />
              Lower friction for builders.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              x402 turns HTTP 402 into a payment rail. The agent pays, the data returns,
              in one round-trip.
            </p>
            <ol className="mt-10 space-y-0 border border-border-brand">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="flex gap-4 border-b border-border-brand p-5 last:border-b-0"
                >
                  <span className="font-mono text-xs font-medium tracking-[0.14em] text-brand-green">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-display tracking-tight">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <PaymentMock />
        </div>
      </section>

      {/* Why AUDD */}
      <section id="audd" className="border-y border-border-brand bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="max-w-2xl">
            <p className="section-label">Why AUDD</p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              The first AUD-native currency for agentic payments.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              x402 today runs on USDC — Australian builders bridge through USD and eat the FX.
              Milypay settles in <span className="font-medium text-fg">AUDD</span>: 1:1
              AUD-backed, regulated, and programmable.
            </p>
          </div>

          <div className="mt-12 grid gap-px border border-border-brand bg-border-brand sm:grid-cols-2 lg:grid-cols-4">
            {WHY_AUDD.map((w) => (
              <div key={w.title} className="bg-card p-6">
                <h3 className="font-display text-base leading-snug tracking-tight">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{w.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-px grid gap-6 border border-border-brand bg-card p-8 sm:grid-cols-2 lg:grid-cols-4">
            {ECOSYSTEM.map((e) => (
              <div key={e.label}>
                <div className="font-display text-3xl tracking-tight">{e.stat}</div>
                <div className="mt-1 text-sm leading-relaxed text-muted">{e.label}</div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Ecosystem figures via Pay.sh and the PayAI x402 facilitator. AUDD is issued 1:1
            and AUD-backed under an AFSL framework. Milypay provides settlement and data
            services only — nothing here is an investment offer.
          </p>
        </div>
      </section>

      {/* Provider onboarding */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 border border-border-brand bg-cream p-8 md:flex-row md:items-center md:p-10">
          <div className="max-w-xl">
            <p className="section-label">For API providers</p>
            <h2 className="font-display mt-2 text-2xl tracking-tight md:text-3xl">
              List your Australian API. Accept AUDD from agents in under 10 minutes.
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Wrap any existing API, set a price in AUDD, and it is discoverable on Pay.sh —
              no merchant account, no card rails, no FX.
            </p>
          </div>
          <Link href="/contact?topic=provider" className="btn-primary shrink-0">
            List your API
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Developers */}
      <section id="developers" className="border-y border-border-brand bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="grid gap-12 md:grid-cols-[1fr_1.05fr] md:items-center">
            <div>
              <p className="section-label">For developers</p>
              <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
                If your agent can make an HTTP request, it can pay.
              </h2>
              <p className="mt-5 leading-relaxed text-muted">
                No API keys, no onboarding forms, no invoices. Point any x402-aware client —
                or the pay.sh MCP — at a Milypay endpoint. First response is a 402; wallet
                approves; data comes back. Settlement in AUDD on Solana via PayAI.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="https://pay.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mono-solid"
                >
                  Find us on pay.sh
                </a>
                <a
                  href="https://x402.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mono"
                >
                  Read the x402 spec
                </a>
              </div>
            </div>

            <div className="lab-panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border-brand px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-border-brand" />
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                <span className="h-2 w-2 rounded-full bg-border-brand" />
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  agent ↔ milypay
                </span>
              </div>
              <pre className="overflow-x-auto bg-bg p-5 text-[13px] leading-relaxed">
                <code>
{`$ curl https://api.milypay.xyz/au-business/abn/51824753556

`}<span className="text-brand-purple">HTTP/1.1 402 Payment Required</span>{`
x-402-price:    0.002
x-402-asset:    AUDD
x-402-network:  solana
x-402-pay-to:   milypay.sol

`}<span className="text-muted"># agent wallet approves, retries with payment…</span>{`

`}<span className="text-brand-green">HTTP/1.1 200 OK</span>{`
{
  "abn": "51824753556",
  "entityName": "MILYSEC PTY LTD",
  "status": "Active",
  "state": "VIC",
  "gstRegistered": true
}`}
                </code>
              </pre>
            </div>
          </div>

          <div className="mt-16">
            <h3 className="font-display text-2xl tracking-tight">Four ways to integrate</h3>
            <p className="mt-2 text-sm text-muted">
              CLI, SDK, MCP, or raw API — every path settles in AUD on x402.
            </p>
            <div className="mt-8 grid gap-px border border-border-brand bg-border-brand md:grid-cols-2 lg:grid-cols-4">
              {ACCESS.map((a) => (
                <div key={a.tag} className="flex flex-col bg-card p-6">
                  <span className="inline-flex w-fit items-center border border-border-brand bg-secondary px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg">
                    {a.tag}
                  </span>
                  <h4 className="mt-4 font-display text-lg tracking-tight">{a.title}</h4>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{a.desc}</p>
                  <div className="mt-4">
                    <CodeBlock code={a.code} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For agents */}
      <section id="for-agents" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="section-label">For your agent</p>
          <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
            Hand it to your agent.
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            Not a developer? Copy one of these into Claude, ChatGPT, Cursor, or any assistant
            that can call URLs — and it can use every Milypay service.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-display text-lg tracking-tight">
              Paste into your agent&rsquo;s instructions
            </h3>
            <p className="mb-3 mt-1 text-sm text-muted">Full capability list.</p>
            <CodeBlock code={AGENT_SYSTEM_PROMPT} plain />
          </div>
          <div>
            <h3 className="font-display text-lg tracking-tight">Or just say this</h3>
            <p className="mb-3 mt-1 text-sm text-muted">For agents that can browse the web.</p>
            <CodeBlock code={AGENT_ONELINER} plain />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-y border-border-brand bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
          />
          <div className="max-w-2xl">
            <p className="section-label">FAQ</p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              Questions agents and builders ask.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              What Milypay is, how x402 payment works, and how to give an AI agent access to
              Australian data.
            </p>
          </div>

          <div className="mt-12 grid gap-px border border-border-brand bg-border-brand md:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.q} className="bg-card p-6">
                <h3 className="font-display text-base leading-snug tracking-tight">{f.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA — quote band */}
      <section className="px-4 py-16 sm:px-6 md:py-24">
        <div className="quote-band mx-auto max-w-6xl px-8 py-14 text-center md:px-16 md:py-20">
          <h2 className="font-display mx-auto max-w-2xl text-3xl tracking-tight md:text-5xl md:leading-[1.1]">
            What if your agent paid for Australia in AUD?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-900/70">
            Ship agents that understand Australia — and pay for what they use, settled in AUDD.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/40"
            >
              Try it live
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/contact?topic=general"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-950/20 bg-transparent px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-950 transition hover:bg-slate-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/30"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
