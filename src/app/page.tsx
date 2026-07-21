import Link from "next/link";
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
    desc: "Official ASIC company extract — directors, secretaries, shareholders, charges, and registered office — resold in AUDD via an approved broker.",
    price: "Coming soon",
    soon: true,
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
    desc: "Agents already operate on Solana. MilyPay settles there for ~1-second finality.",
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
    desc: "Hit any endpoint from your terminal. The pay.sh CLI handles the 402 challenge and wallet approval.",
    code: "npx pay.sh call milysec/au-business/abn 51824753556",
  },
  {
    tag: "SDK",
    title: "TypeScript & Python",
    desc: "Drop-in x402 client. Wrap fetch, get auto-paid responses — no manual payment plumbing.",
    code: 'import { MilyPay } from "@milypay/sdk";\nconst au = new MilyPay({ wallet });\nawait au.business.abn("51824753556");',
  },
  {
    tag: "MCP",
    title: "Model Context Protocol",
    desc: "Expose MilyPay to any agent via the pay.sh MCP server. Discover, price, and pay as tools.",
    code: '// claude / cursor mcp config\n{ "pay": { "command": "npx", "args": ["pay.sh", "mcp"] } }',
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
    desc: "Hit a MilyPay endpoint for Australian data — no API key, no signup.",
  },
  {
    n: "02",
    title: "402 Payment Required",
    desc: "MilyPay answers with price, asset (AUDD), and pay-to address.",
  },
  {
    n: "03",
    title: "Pay & receive",
    desc: "Wallet approves the micropayment. Data returns in the same round-trip.",
  },
];

const AGENT_SYSTEM_PROMPT = `You can use MilyPay, free Australian data APIs at https://api.milypay.xyz (no API key needed). Make a GET request and read the JSON:
- Australian business by ABN: /au-business/abn/{abn}
- Business by ACN: /au-business/acn/{acn}
- Business name search: /au-business/search?name={name}
- Company (ASIC) by ACN: /au-company/acn/{acn}
- Company name search: /au-company/search?name={name}
- Super fund by ABN: /au-super/abn/{abn}
- Validate or geocode an address: /au-address/validate?q={address}
- Weather for an address: /au-weather?q={address}
- Postage between postcodes: /au-postage?from={from}&to={to}&weight={kg}
Full reference: https://milypay.xyz/agents.md`;

const AGENT_ONELINER = `Use the MilyPay APIs at https://api.milypay.xyz for Australian business, address, super fund, and weather data. Read https://milypay.xyz/agents.md first, then call the endpoints with a GET request and read the JSON.`;

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is MilyPay?",
    a: "MilyPay is the x402 service provider for the Australian market. It gives AI agents pay-per-call access to Australian data — business identity, company register, addresses, super funds, weather, and postage — settled in AUDD, the regulated AUD-native stablecoin, with no API keys and no signup. MilyPay is a Milysec company.",
  },
  {
    q: "How do AI agents pay for Australian data on MilyPay?",
    a: "Agents use the x402 protocol. An agent requests an endpoint, receives an HTTP 402 Payment Required response with the price in AUDD, approves the micropayment from an x402-aware wallet, and the data returns in the same round-trip. It works through the Pay.sh CLI, an SDK, the MCP server, or raw HTTP.",
  },
  {
    q: "What is x402?",
    a: "x402 is an open protocol that turns the HTTP 402 Payment Required status code into a real payment rail, letting a client pay for an API call inline. MilyPay uses x402 so AI agents can pay per request, settling in AUD stablecoins on Solana via the PayAI facilitator.",
  },
  {
    q: "Do I need an API key or account to use MilyPay?",
    a: "No. MilyPay has no accounts, no API keys, and no signup. Any x402-aware client pays per call and receives the data back in the same request.",
  },
  {
    q: "What is AUDD and why does MilyPay settle in it?",
    a: "AUDD is a 1:1 AUD-backed, AFSL-regulated stablecoin live on Solana. MilyPay settles in AUDD so Australian agents and builders avoid the USD foreign-exchange round-trip that USDC-based x402 services require. AUDM and other regulated AUD stablecoins are added as they reach Solana.",
  },
  {
    q: "How do I give my AI agent access to Australian data?",
    a: "Point your agent at https://milypay.xyz/agents.md, or add the Pay.sh MCP server to Claude, ChatGPT, Cursor, or any MCP-compatible client. The agent can then discover, price, and call every MilyPay service. You can also paste the ready-made MilyPay prompt from the home page.",
  },
  {
    q: "What Australian data does MilyPay provide?",
    a: "Business identity (ABN and ACN lookup from the ABR), ASIC company register lookups, address validation and geocoding (G-NAF, 16.9M addresses), super fund lookup, weather (BOM ACCESS-G via Open-Meteo), Australia Post postage rates, and BSB lookup (17,000+ BSBs from the AusPayNet directory). More Australian services are on the roadmap.",
  },
  {
    q: "Which AI tools and agents work with MilyPay?",
    a: "Any agent or assistant that can make an HTTP request: Claude, ChatGPT, Cursor, and any Model Context Protocol client via the Pay.sh MCP server. If your agent can call a URL, it can use MilyPay.",
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
  "x402 protocol",
  "PayAI facilitator",
  "pay.sh catalog",
  "AUDD on Solana",
  "Milysec",
];

function PaymentMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[28px] bg-cream sm:-inset-6" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-border-brand bg-card shadow-[0_20px_50px_rgba(43,43,43,0.08)]">
        <div className="flex items-center justify-between border-b border-border-brand px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e3e0de]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e3e0de]" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-green-bright" />
          </div>
          <span className="text-xs font-medium text-muted">api.milypay.xyz</span>
        </div>
        <div className="space-y-4 p-5 font-mono text-[12px] leading-relaxed sm:p-6 sm:text-[13px]">
          <div>
            <div className="text-muted">$ curl /au-business/abn/51824753556</div>
          </div>
          <div className="rounded-xl bg-secondary p-4">
            <div className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
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
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-green/15 text-[10px] font-bold text-brand-green">
              ✓
            </span>
            <span>wallet approves · PayAI settles</span>
          </div>
          <div className="rounded-xl border border-brand-green/25 bg-brand-green/5 p-4">
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
    <main className="flex-1">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:pb-28 md:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border-brand bg-card px-3.5 py-1.5 text-xs font-medium text-muted shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              AUD-native settlement on x402
            </div>

            <h1 className="font-display mt-7 text-[2.75rem] leading-[1.05] text-fg sm:text-6xl md:text-[3.75rem]">
              Keep agent spend{" "}
              <span className="text-brand-green">in AUD</span>
              <span className="block">on every call.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              MilyPay gives AI agents pay-per-call access to Australian data — business,
              address, weather, postage — settled in AUDD. No keys. No signup. Just 402.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className="btn-primary">
                Try it live
              </Link>
              <a href="#developers" className="btn-secondary">
                Start building
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-medium text-muted">
              {TRUST.map((t, i) => (
                <span key={t} className="inline-flex items-center gap-2">
                  {i > 0 && (
                    <span className="select-none text-border-brand" aria-hidden>
                      ·
                    </span>
                  )}
                  <span>{t}</span>
                </span>
              ))}
            </div>
          </div>

          <PaymentMock />
        </div>
      </section>

      {/* Calculator */}
      <section className="border-y border-border-brand bg-secondary/60">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <CostCalculator />
        </div>
      </section>

      {/* The gap + stats */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="eyebrow">The gap</p>
            <h2 className="font-display mt-3 text-3xl md:text-4xl">
              Every x402 provider is global.
              <br className="hidden sm:block" />
              None of them own Australia.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-muted">
              The pay.sh catalog is full of horizontal providers — crypto data, email, OCR,
              search. None speak Australian. No ABN lookup, no GNAF addresses, no BOM weather,
              no AUD rail. MilyPay is the local layer for agents operating here.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["74", "providers on pay.sh"],
              ["0", "serving Australia — until now"],
              ["1", "namespace: milysec/*"],
              ["AUD", "native settlement"],
            ].map(([stat, label]) => (
              <div key={label} className="card-flat p-5">
                <div className="text-3xl font-semibold tracking-tight text-fg">{stat}</div>
                <div className="mt-1 text-sm text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-y border-border-brand bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Services</p>
            <h2 className="font-display mt-3 text-3xl md:text-4xl">
              Australian data, priced per call — in AUDD.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Endpoints under the <code className="text-fg">milysec/*</code> namespace, listed
              on Pay.sh. Metered, pay-as-you-go, settled in AUDD.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.tag}
                className="card-flat flex flex-col p-6 transition hover:border-fg/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs text-brand-purple">milysec/{s.tag}</code>
                  {s.soon && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Soon
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.desc}</p>
                <div
                  className={`mt-5 border-t border-border-brand pt-4 text-sm font-medium ${
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

      {/* How it works — split like Decal */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="font-display mt-3 text-3xl md:text-4xl">
              Same request for agents.
              <br />
              Lower friction for builders.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              x402 turns HTTP 402 into a payment rail. The agent pays, the data returns,
              in one round-trip.
            </p>
            <ol className="mt-10 space-y-6">
              {STEPS.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cta text-xs font-semibold text-cta-fg">
                    {step.n.replace("0", "")}
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight">{step.title}</h3>
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
      <section id="audd" className="border-y border-border-brand bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Why AUDD</p>
            <h2 className="font-display mt-3 text-3xl md:text-4xl">
              The first AUD-native currency for agentic payments.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              x402 today runs on USDC — Australian builders bridge through USD and eat the FX.
              MilyPay settles in <span className="text-fg font-medium">AUDD</span>: 1:1
              AUD-backed, regulated, and programmable.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_AUDD.map((w) => (
              <div key={w.title} className="card-flat p-6">
                <h3 className="text-base font-semibold leading-snug tracking-tight">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{w.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 rounded-2xl border border-border-brand bg-card p-8 sm:grid-cols-2 lg:grid-cols-4">
            {ECOSYSTEM.map((e) => (
              <div key={e.label}>
                <div className="text-3xl font-semibold tracking-tight">{e.stat}</div>
                <div className="mt-1 text-sm leading-relaxed text-muted">{e.label}</div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Ecosystem figures via Pay.sh and the PayAI x402 facilitator. AUDD is issued 1:1
            and AUD-backed under an AFSL framework. MilyPay provides settlement and data
            services only — nothing here is an investment offer.
          </p>
        </div>
      </section>

      {/* Provider onboarding */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-border-brand bg-cream p-8 md:flex-row md:items-center md:p-10">
          <div className="max-w-xl">
            <p className="eyebrow">For API providers</p>
            <h2 className="font-display mt-2 text-2xl md:text-3xl">
              List your Australian API. Accept AUDD from agents in under 10 minutes.
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Wrap any existing API, set a price in AUDD, and it is discoverable on Pay.sh —
              no merchant account, no card rails, no FX.
            </p>
          </div>
          <Link href="/contact?topic=provider" className="btn-primary shrink-0">
            List your API
          </Link>
        </div>
      </section>

      {/* Developers */}
      <section id="developers" className="border-y border-border-brand bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-[1fr_1.05fr] md:items-center">
            <div>
              <p className="eyebrow">For developers</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl">
                If your agent can make an HTTP request, it can pay.
              </h2>
              <p className="mt-5 leading-relaxed text-muted">
                No API keys, no onboarding forms, no invoices. Point any x402-aware client —
                or the pay.sh MCP — at a MilyPay endpoint. First response is a 402; wallet
                approves; data comes back. Settlement in AUDD on Solana via PayAI.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="https://pay.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Find us on pay.sh
                </a>
                <a
                  href="https://x402.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Read the x402 spec
                </a>
              </div>
            </div>

            <div className="card-flat overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border-brand px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-border-brand" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-green-bright" />
                <span className="h-2.5 w-2.5 rounded-full bg-border-brand" />
                <span className="ml-2 text-xs text-muted">agent ↔ milypay</span>
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
            <h3 className="font-display text-2xl">Four ways to integrate</h3>
            <p className="mt-2 text-sm text-muted">
              CLI, SDK, MCP, or raw API — every path settles in AUD on x402.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {ACCESS.map((a) => (
                <div key={a.tag} className="card-flat flex flex-col p-6">
                  <span className="inline-flex w-fit items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-fg">
                    {a.tag}
                  </span>
                  <h4 className="mt-4 text-lg font-semibold tracking-tight">{a.title}</h4>
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
      <section id="for-agents" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">For your agent</p>
          <h2 className="font-display mt-3 text-3xl md:text-4xl">
            Hand it to your agent.
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            Not a developer? Copy one of these into Claude, ChatGPT, Cursor, or any assistant
            that can call URLs — and it can use every MilyPay service.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Paste into your agent&rsquo;s instructions
            </h3>
            <p className="mb-3 mt-1 text-sm text-muted">Full capability list.</p>
            <CodeBlock code={AGENT_SYSTEM_PROMPT} plain />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Or just say this</h3>
            <p className="mb-3 mt-1 text-sm text-muted">For agents that can browse the web.</p>
            <CodeBlock code={AGENT_ONELINER} plain />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-y border-border-brand bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
          />
          <div className="max-w-2xl">
            <p className="eyebrow">FAQ</p>
            <h2 className="font-display mt-3 text-3xl md:text-4xl">
              Questions agents and builders ask.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              What MilyPay is, how x402 payment works, and how to give an AI agent access to
              Australian data.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.q} className="card-flat p-6">
                <h3 className="text-base font-semibold leading-snug tracking-tight">{f.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark closing CTA — Decal pattern */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-cta px-8 py-14 text-center text-cta-fg md:px-16 md:py-20">
          <h2 className="font-display mx-auto max-w-2xl text-3xl md:text-5xl md:leading-[1.1]">
            What if your agent paid for Australia in AUD?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/65">
            Ship agents that understand Australia — and pay for what they use, settled in AUDD.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-cta transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Try it live
            </Link>
            <Link
              href="/contact?topic=general"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
