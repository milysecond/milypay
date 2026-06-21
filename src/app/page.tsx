import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import CodeBlock from "@/components/CodeBlock";

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
    desc: "ABN / ACN lookup, ASIC company data, director and entity verification - agent-grade KYB for Australian businesses.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-company",
    title: "Company register",
    desc: "ASIC company lookup by ACN or name - status, type, class, registration dates, and former names. 3.9M companies.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-company-report",
    title: "ASIC company report",
    desc: "Official ASIC company extract - directors, secretaries, shareholders, charges, and registered office - resold in AUDD via an approved broker.",
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
    desc: "Verify any Australian super fund by ABN - fund name, status, type, complying status, and USIs, from the ATO register.",
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
    desc: "Validate any BSB number and get the bank name, branch, address, and supported payment methods (paper, electronic, high-value). 17,000+ BSBs from the AusPayNet directory.",
    price: "from $0.002 / call",
  },
  {
    tag: "au-tracking",
    title: "Parcel tracking",
    desc: "Track an Australia Post parcel by tracking number - status and full event history.",
    price: "Coming soon",
    soon: true,
  },
  {
    tag: "au-money",
    title: "Money & FX",
    desc: "AUD reference rates, RBA data, and AUD-denominated settlement - the currency layer agents need locally.",
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
    desc: "Agents need stable, compliant settlement - not volatile crypto. AUDD is fully backed and issued under an AFSL framework.",
  },
  {
    title: "Programmable money",
    desc: "Smart contracts handle quoting, escrow, splits, and refunds autonomously - no human in the loop.",
  },
  {
    title: "Multi-chain, Solana-first",
    desc: "AUDD meets agents where they already operate. MilyPay settles on Solana for ~1-second finality.",
  },
  {
    title: "On-chain AUD, zero FX friction",
    desc: "x402 is dominated by USDC. AUDD is the first AUD-native option - Australian builders stop bridging through USD.",
  },
];

const ECOSYSTEM = [
  { stat: "72+", label: "services on Pay.sh, backed by the Solana Foundation" },
  { stat: "1,000+", label: "companies in the PayAI facilitator ecosystem" },
  { stat: "~1s", label: "settlement, 99.9% success rate" },
  { stat: "10 min", label: "for any AU API to start accepting AUDD" },
];

const ACCESS = [
  {
    tag: "CLI",
    title: "Command line",
    desc: "Hit any endpoint from your terminal. The pay.sh CLI handles the 402 challenge and wallet approval for you.",
    code: "npx pay.sh call milysec/au-business/abn 51824753556",
  },
  {
    tag: "SDK",
    title: "TypeScript & Python",
    desc: "Drop-in x402 client. Wrap fetch, get auto-paid responses - no manual payment plumbing.",
    code: "import { MilyPay } from \"@milypay/sdk\";\nconst au = new MilyPay({ wallet });\nawait au.business.abn(\"51824753556\");",
  },
  {
    tag: "MCP",
    title: "Model Context Protocol",
    desc: "Expose MilyPay to any agent via the pay.sh MCP server. Agents discover, price, and pay for Australian data as tools.",
    code: "// claude / cursor mcp config\n{ \"pay\": { \"command\": \"npx\", \"args\": [\"pay.sh\", \"mcp\"] } }",
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
    desc: "An AI agent hits a MilyPay endpoint for Australian data - no API key, no signup.",
  },
  {
    n: "02",
    title: "402 Payment Required",
    desc: "MilyPay answers with an x402 challenge: price, asset (AUDD), and pay-to address.",
  },
  {
    n: "03",
    title: "Pay & receive",
    desc: "Via the PayAI facilitator, the agent's wallet approves the micropayment, settles in AUDD, and the data returns in the same round-trip.",
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

// FAQ doubles as on-page content and FAQPage structured data. Questions are phrased
// the way people ask AI assistants, so LLMs can lift the answers when citing MilyPay.
const FAQ: { q: string; a: string }[] = [
  {
    q: "What is MilyPay?",
    a: "MilyPay is the x402 service provider for the Australian market. It gives AI agents pay-per-call access to Australian data - business identity, company register, addresses, super funds, weather, and postage - settled in AUDD, the regulated AUD-native stablecoin, with no API keys and no signup. MilyPay is a Milysec company.",
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

export default function Home() {
  return (
    <main className="flex-1">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
          <a
            href="https://x402.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border-brand bg-card px-3.5 py-1.5 text-xs text-muted transition hover:text-fg"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
            AUD-native settlement on x402 · AUDD × PayAI × pay.sh
          </a>

          <h1 className="font-display mt-7 max-w-4xl text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Agent payments &amp;{" "}
            <span className="brand-gradient-text">Australian data</span>, on x402.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            MilyPay is the x402 service provider built for Australia. AI agents get
            pay-per-call access to Australian data - business identity, property,
            weather, civic - settled in <span className="text-fg">AUDD</span>, the
            regulated AUD-native stablecoin. No keys. No signup. Just 402.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/demo"
              className="rounded-full bg-brand-green px-6 py-3 text-center text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Try it live
            </Link>
            <a
              href="#developers"
              className="rounded-full border border-border-brand bg-card px-6 py-3 text-center text-sm font-semibold text-fg transition hover:border-brand-green/40"
            >
              Start building
            </a>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted">
            <span className="uppercase tracking-widest">Built on</span>
            <span>x402 protocol</span>
            <span className="text-border-brand">·</span>
            <span>PayAI facilitator</span>
            <span className="text-border-brand">·</span>
            <span>pay.sh catalog</span>
            <span className="text-border-brand">·</span>
            <span>AUDD on Solana</span>
          </div>
        </div>
      </section>

      {/* The gap */}
      <section className="border-y border-border-brand bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
              The gap
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              Every x402 provider is global. <br className="hidden md:block" />
              None of them own Australia.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-muted">
              The pay.sh catalog is full of horizontal providers - crypto data, email,
              OCR, search. Useful, but none speak Australian. No ABN lookup, no GNAF
              addresses, no BOM weather, no AUD rail. MilyPay is the one provider that
              does - the local layer for agents operating in Australia.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["74", "providers on pay.sh"],
              ["0", "serving Australia - until now"],
              ["1", "namespace: milysec/*"],
              ["AUD", "native settlement"],
            ].map(([stat, label]) => (
              <div key={label} className="card p-5">
                <div className="font-display text-3xl brand-gradient-text">{stat}</div>
                <div className="mt-1 text-sm text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
            Services
          </p>
          <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
            Australian data, priced per call - in AUDD.
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            Endpoints under the <code className="text-fg">milysec/*</code> namespace, listed
            on Pay.sh. Metered, pay-as-you-go, settled in AUDD. No commitment.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.tag}
              className="card group p-6 transition hover:border-brand-green/40"
            >
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-brand-purple">milysec/{s.tag}</code>
                {s.soon && (
                  <span className="rounded-full border border-border-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Soon
                  </span>
                )}
              </div>
              <h3 className="font-display mt-3 text-xl tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
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
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border-brand bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
              How it works
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              One round-trip. No accounts.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              x402 turns HTTP 402 - &ldquo;Payment Required&rdquo; - into a real payment
              rail. The agent pays, the data returns, in the same request.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="card p-6">
                <div className="font-display text-2xl brand-gradient-text">{step.n}</div>
                <h3 className="font-display mt-4 text-lg tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AUDD */}
      <section id="audd" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
            Why AUDD
          </p>
          <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
            The first AUD-native currency for agentic payments.
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            x402 today runs on USDC - Australian builders bridge through USD and eat the FX.
            MilyPay settles in <span className="text-fg">AUDD</span>: 1:1 AUD-backed,
            regulated, and programmable. Australia&rsquo;s on-chain dollar for the agent economy.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {WHY_AUDD.map((w) => (
            <div key={w.title} className="card p-6">
              <h3 className="font-display text-lg leading-snug tracking-tight">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{w.desc}</p>
            </div>
          ))}
        </div>

        {/* Ecosystem proof */}
        <div className="mt-6 grid gap-4 rounded-2xl border border-border-brand bg-card/40 p-8 sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM.map((e) => (
            <div key={e.label}>
              <div className="font-display text-3xl brand-gradient-text">{e.stat}</div>
              <div className="mt-1 text-sm leading-relaxed text-muted">{e.label}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Ecosystem figures via Pay.sh (Solana Foundation; partners Crossmint, MoonPay,
          Merit Systems, Corbits) and the PayAI x402 facilitator. AUDD is issued 1:1 and
          AUD-backed under an AFSL framework. MilyPay provides settlement and data services
          only - nothing here is an investment offer.
        </p>
      </section>

      {/* Provider onboarding */}
      <section className="border-y border-border-brand bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
              For API providers
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              List your Australian API. Accept AUDD from agents in under 10 minutes.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Wrap any existing API with the MilyPay reference implementation, set a price in
              AUDD, and it&rsquo;s discoverable and payable by every agent on Pay.sh - no
              merchant account, no card rails, no FX.
            </p>
          </div>
          <Link
            href="/contact?topic=provider"
            className="shrink-0 rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
          >
            List your API
          </Link>
        </div>
      </section>

      {/* Developers / code */}
      <section id="developers" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
              For developers
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              If your agent can make an HTTP request, it can pay.
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              No API keys, no onboarding forms, no invoices. Point any x402-aware client
              - or the pay.sh MCP - at a MilyPay endpoint. The first response is a 402
              with the price; your wallet approves it; the data comes back. Settlement is
              in AUDD on Solana via the PayAI facilitator.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <a
                href="https://pay.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand-green px-5 py-2.5 font-semibold text-bg transition hover:opacity-90"
              >
                Find us on pay.sh ↗
              </a>
              <a
                href="https://x402.org"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border-brand bg-card px-5 py-2.5 font-semibold text-fg transition hover:border-brand-green/40"
              >
                Read the x402 spec ↗
              </a>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border-brand px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-brand-purple/60" />
              <span className="h-3 w-3 rounded-full bg-brand-green/60" />
              <span className="h-3 w-3 rounded-full bg-muted/30" />
              <span className="ml-2 text-xs text-muted">agent ↔ milypay</span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
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

        {/* Access methods: CLI / SDK / MCP / API */}
        <div className="mt-16">
          <h3 className="font-display text-2xl tracking-tight">
            Four ways to integrate
          </h3>
          <p className="mt-2 text-sm text-muted">
            CLI, SDK, MCP, or raw API - every path settles in AUD on x402.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ACCESS.map((a) => (
              <div
                key={a.tag}
                className="card flex flex-col p-6 transition hover:border-brand-green/40"
              >
                <span className="inline-flex w-fit items-center rounded-full border border-border-brand px-2.5 py-1 text-xs font-semibold text-brand-green">
                  {a.tag}
                </span>
                <h4 className="font-display mt-4 text-lg tracking-tight">{a.title}</h4>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{a.desc}</p>
                <div className="mt-4">
                  <CodeBlock code={a.code} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hand it to your agent */}
      <section id="for-agents" className="border-y border-border-brand bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
              For your agent
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
              Hand it to your agent.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Not a developer? Copy one of these into your AI agent - Claude, ChatGPT, Cursor,
              or any assistant that can browse or call URLs - and it can use every MilyPay
              service. No keys, no setup.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-display text-lg tracking-tight">
                Paste into your agent&rsquo;s instructions
              </h3>
              <p className="mb-3 mt-1 text-sm text-muted">Gives it the full capability list.</p>
              <CodeBlock code={AGENT_SYSTEM_PROMPT} plain />
            </div>
            <div>
              <h3 className="font-display text-lg tracking-tight">Or just say this</h3>
              <p className="mb-3 mt-1 text-sm text-muted">
                For agents that can browse the web.
              </p>
              <CodeBlock code={AGENT_ONELINER} plain />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - on-page content and FAQPage structured data for AI assistants */}
      <section id="faq" className="mx-auto max-w-6xl px-6 py-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
        />
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
            FAQ
          </p>
          <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
            Questions agents and builders ask.
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            What MilyPay is, how x402 payment works, and how to give an AI agent access to
            Australian data.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q} className="card p-6">
              <h3 className="font-display text-lg leading-snug tracking-tight">{f.q}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="card relative overflow-hidden p-10 text-center md:p-16">
          <div className="hero-glow absolute inset-0 -z-10" />
          <h2 className="font-display mx-auto max-w-2xl text-3xl tracking-tight md:text-5xl">
            The Australian layer for agent payments.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
            Ship agents that understand Australia - and pay for what they use, in AUD.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://pay.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Start building
            </a>
            <Link
              href="/contact?topic=general"
              className="rounded-full border border-border-brand bg-bg px-6 py-3 text-sm font-semibold text-fg transition hover:border-brand-green/40"
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
