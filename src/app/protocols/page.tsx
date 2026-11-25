import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import CodeBlock from "@/components/CodeBlock";

const TITLE = "Protocols - x402, MCP, MPP, OpenAPI and more | Milypay";
const DESCRIPTION =
  "Every open protocol Milypay speaks: x402 v2 on Solana via PayAI, MPP on Tempo, MCP, the milypay CLI and SDK, plain HTTP 402 with OpenAPI 3.1, agents.md, llms.txt and the x402 Bazaar extension.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/protocols" },
  openGraph: {
    title: "Milypay protocols - how agents discover, pay for and call Australian data",
    description: DESCRIPTION,
    url: "https://milypay.xyz/protocols",
    siteName: "Milypay",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Milypay protocols - x402, MCP, MPP, OpenAPI",
    description: DESCRIPTION,
    creator: "@1milysec",
    site: "@1milysec",
  },
};

type Status = "live" | "scaffold";

const STATUS_STYLE: Record<Status, string> = {
  live: "border-brand-green/40 text-brand-green",
  scaffold: "border-border-brand text-muted",
};

const SUMMARY: { id: string; name: string; role: string; status: Status; label: string }[] = [
  { id: "x402", name: "x402 v2", role: "Pay per call over HTTP 402 on Solana", status: "live", label: "Live · default" },
  { id: "settlement", name: "Solana stablecoins", role: "USDC, USDT, AUDD, AUDM, dAUD on one challenge", status: "live", label: "Live" },
  { id: "mpp", name: "MPP (Tempo)", role: "Second payment rail, opt-in", status: "live", label: "Live · opt-in" },
  { id: "mcp", name: "MCP", role: "Tools for Claude, Cursor and any MCP client", status: "live", label: "Live · stdio" },
  { id: "cli", name: "milypay CLI", role: "One command per dataset", status: "live", label: "Live" },
  { id: "sdk", name: "milypay-sdk", role: "Typed TypeScript client", status: "live", label: "Live" },
  { id: "http", name: "HTTP 402 + OpenAPI 3.1", role: "Any language, any HTTP client", status: "live", label: "Live" },
  { id: "discovery", name: "agents.md · llms.txt · well-known", role: "How agents find us", status: "live", label: "Live" },
  { id: "bazaar", name: "x402 Bazaar extension", role: "Discovery metadata inside every 402", status: "live", label: "Live" },
];

function Spec({ links }: { links: { href: string; label: string }[] }) {
  return (
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      <span className="fig-label">Spec &amp; links</span>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target={l.href.startsWith("/") ? undefined : "_blank"}
          rel={l.href.startsWith("/") ? undefined : "noopener noreferrer"}
          className="text-muted underline underline-offset-4 transition-colors hover:text-brand-green"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

function Protocol({
  id,
  kicker,
  title,
  status,
  children,
  why,
  code,
  codeLabel,
  links,
}: {
  id: string;
  kicker: string;
  title: string;
  status: { s: Status; label: string };
  children: React.ReactNode;
  why: string;
  code: string;
  codeLabel?: string;
  links: { href: string; label: string }[];
}) {
  return (
    <section id={id} className="scroll-mt-20 card p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-green">{kicker}</p>
          <h2 className="font-display mt-2 text-2xl tracking-tight md:text-3xl">{title}</h2>
        </div>
        <span
          className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status.s]}`}
        >
          {status.label}
        </span>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-4 text-sm leading-relaxed text-muted">
          {children}
          <div className="rounded-lg border border-border-brand bg-bg/60 p-4">
            <p className="fig-label mb-1.5">Why it matters for agents</p>
            <p>{why}</p>
          </div>
        </div>
        <div className="min-w-0">
          <CodeBlock code={code} label={codeLabel} />
        </div>
      </div>
      <Spec links={links} />
    </section>
  );
}

const X402_CODE = `# 1. Ask for data with no payment
curl -i https://api.milypay.xyz/au-business/abn/55695484756

HTTP/2 402
PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6Mi...   # base64 JSON

# 2. Decoded challenge (one entry per accepted asset)
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount": "2000",
    "payTo": "mi1ytDfgNFYgm54y4f3xzRQbfbyCz6TBmQcAL3brozA",
    "maxTimeoutSeconds": 60,
    "extra": { "feePayer": "CjNFTjvBhbJJd2B5ePPMHRLx1ELZpa8dwQgGL727eKww" }
  }, ...]
}

# 3. Sign the transfer, retry with the payment
curl https://api.milypay.xyz/au-business/abn/55695484756 \\
  -H "PAYMENT-SIGNATURE: <base64 payment payload>"
# v1 clients can send X-PAYMENT instead

# 4. 200 OK + PAYMENT-RESPONSE, X-Milypay-Tx, X-Milypay-Explorer`;

const SETTLE_CODE = `# Same ABN lookup, same price, five assets on Solana mainnet
USDC  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  amount 2000      (6 dp)
USDT  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB  amount 2000      (6 dp)
AUDD  AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw  amount 2000      (6 dp)
AUDM  CiYXBwHPrdNkMtxR8YEWKv78K6bQjFoEWhPQrZqEmubi  amount 2000      (6 dp)
dAUD  F7FiKutfrMMXd8Zw5ysZsfx5v4aBHffWc4EhRZE8NHiF  amount 2000000   (9 dp)

# Your wallet picks whichever it holds. Live list:
curl https://milypay.xyz/api/status   # payments.solana.assets`;

const MPP_CODE = `# Ask for the MPP rail explicitly
curl -i 'https://api.milypay.xyz/au-energy/nem?rail=mpp'
# or: -H 'X-Payment-Rail: mpp'

HTTP/2 402
WWW-Authenticate: Payment id="...", realm="api.milypay.xyz",
  method="tempo", intent="charge", request="eyJhbW91bnQiOi..."

# Pay pathUSD on Tempo mainnet (eip155:4217), then retry with
Authorization: Payment <credential>

# No rail hint? You get the default Solana x402 challenge.`;

const MCP_CODE = `// claude_desktop_config.json, .cursor/mcp.json, etc.
{
  "mcpServers": {
    "milypay": {
      "command": "npx",
      "args": ["-y", "milypay", "mcp"],
      "env": { "MILYPAY_HOST": "demo" }
    }
  }
}

// Paid tools: MILYPAY_HOST=api + MILYPAY_PRIVATE_KEY=<base58>`;

const CLI_CODE = `# Free, throttled demo host
npx milypay abn 55695484756
npx milypay cpi
npx milypay nem vic
npx milypay transit seq summary

# Paid API: the CLI answers the 402 for you
export MILYPAY_PRIVATE_KEY=<base58 solana secret>
npx milypay --api abn 55695484756
# -> JSON + $receipt.explorerUrl`;

const SDK_CODE = `npm i milypay-sdk

import { Milypay } from "milypay-sdk";

// Free demo host (rate-limited)
const demo = new Milypay({ host: "demo" });
await demo.business.abn("55695484756");

// Paid API: signs the x402 payment with your wallet
const au = new Milypay({
  host: "api",
  privateKey: process.env.MILYPAY_PRIVATE_KEY!,
});
const co = await au.company.acn("695484756");
// co.$receipt -> settlement signature + explorer link`;

const HTTP_CODE = `# Free demo: /api prefix on the apex host
curl https://milypay.xyz/api/au-business/abn/55695484756

# Paid: root paths on api.milypay.xyz (402 until paid)
curl -i https://api.milypay.xyz/au-business/abn/55695484756

# Full machine-readable surface
curl https://milypay.xyz/openapi.json`;

const DISCOVERY_CODE = `GET https://milypay.xyz/agents.md                     # agent guide
GET https://milypay.xyz/llms.txt                      # LLM summary
GET https://milypay.xyz/llms-full.txt                 # every endpoint
GET https://milypay.xyz/openapi.json                  # OpenAPI 3.1
GET https://milypay.xyz/.well-known/x402              # x402 manifest
GET https://milypay.xyz/.well-known/api-catalog       # RFC 9727
GET https://milypay.xyz/.well-known/mcp/server-card.json
GET https://milypay.xyz/mcp                           # MCP setup`;

const BAZAAR_CODE = `// Inside every decoded PAYMENT-REQUIRED challenge
"resource": {
  "url": "https://api.milypay.xyz/au-business/abn/55695484756",
  "description": "ABN lookup for 55695484756",
  "mimeType": "application/json",
  "serviceName": "Milypay",
  "tags": ["australia", "data", "solana", "agents", "x402"],
  "iconUrl": "https://milypay.xyz/icon.png"
},
"extensions": {
  "bazaar": { ...input/output schema for the endpoint },
  "milypayFunding": { ...how to top up a wallet first }
}`;

const SOLANA_AI_LINKS: { href: string; label: string; desc: string }[] = [
  { href: "https://solana.ai", label: "solana.ai", desc: "The Solana Foundation's home for AI on Solana." },
  { href: "https://solana.ai/#products", label: "Solana AI products", desc: "Confidential Compute, pay.sh, Payment Channels, the Developer Platform and the AI Toolkit." },
  { href: "https://solana.com/x402", label: "x402 on Solana", desc: "Solana's x402 overview, linked from solana.ai." },
  { href: "https://github.com/solana-foundation/x402", label: "solana-foundation/x402", desc: "The Foundation's x402 source." },
  { href: "https://pay.sh", label: "pay.sh", desc: "Give an agent a Solana wallet and it pays per call in USDC." },
  { href: "https://mcp.solana.com", label: "Solana MCP", desc: "The remote Solana Developer MCP for your IDE." },
  { href: "https://solana.com/agent-registry", label: "Agent Registry", desc: "Register and discover agents on Solana." },
  { href: "https://github.com/solana-foundation/awesome-solana-ai", label: "awesome-solana-ai", desc: "The Foundation's curated list of Solana AI tools." },
];

export default function ProtocolsPage() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-brand">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">Protocols</p>
          <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.08] tracking-tight md:text-6xl">
            Open protocols. <span className="brand-gradient-text">No API keys.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Milypay is built on open standards an agent already understands: HTTP 402 to ask for
            payment, x402 to pay it on Solana, MCP to plug into an assistant, and plain
            OpenAPI, agents.md and llms.txt to find out what&rsquo;s on offer. Here is every one we
            support, how it works, and the spec behind it.
          </p>
        </div>
      </section>

      {/* Summary table */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl tracking-tight md:text-4xl">At a glance</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border-brand font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                <th className="py-3 pr-4">Protocol</th>
                <th className="py-3 pr-4">What it does for you</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {SUMMARY.map((r) => (
                <tr key={r.id} className="border-b border-border-brand/60">
                  <td className="py-3 pr-4">
                    <a href={`#${r.id}`} className="text-fg underline-offset-4 hover:text-brand-green hover:underline">
                      {r.name}
                    </a>
                  </td>
                  <td className="py-3 pr-4">{r.role}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                      {r.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment rails */}
      <section className="border-y border-border-brand bg-card/40">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-16">
          <div className="max-w-2xl">
            <p className="fig-label">Payment</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">How agents pay</h2>
          </div>

          <Protocol
            id="x402"
            kicker="Default rail"
            title="x402 v2 on Solana, via PayAI"
            status={{ s: "live", label: "Live · default" }}
            why="Payment is the authentication. An agent can call a Milypay endpoint it has never seen before, read the price from the 402, pay a fraction of a cent and get the data in the same request. No signup, no key to store or rotate."
            code={X402_CODE}
            codeLabel="Request → 402 → pay → data"
            links={[
              { href: "https://x402.org", label: "x402.org" },
              { href: "https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md", label: "x402 v2 spec" },
              { href: "https://www.rfc-editor.org/rfc/rfc9110#name-402-payment-required", label: "RFC 9110 · 402" },
              { href: "https://docs.payai.network/x402", label: "PayAI facilitator docs" },
            ]}
          >
            <p>
              Every paid endpoint on <code>api.milypay.xyz</code> answers an unpaid request with{" "}
              <strong className="text-fg">HTTP 402</strong> and a base64 JSON challenge in the{" "}
              <code>PAYMENT-REQUIRED</code> header. It uses the <code>exact</code> scheme on Solana
              mainnet (<code>solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp</code>) and lists the price,
              the pay-to address and one entry per accepted stablecoin.
            </p>
            <p>
              Your wallet signs the transfer and retries with <code>PAYMENT-SIGNATURE</code>{" "}
              (x402 v2). The older v1 <code>X-PAYMENT</code> header is accepted too. Milypay
              verifies the payment with the{" "}
              <a href="https://payai.network" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">PayAI</a>{" "}
              facilitator, serves the data, then settles on-chain and returns the receipt in{" "}
              <code>PAYMENT-RESPONSE</code> and <code>X-Milypay-Tx</code>.
            </p>
            <p>
              Network fees are sponsored. The challenge&rsquo;s <code>extra.feePayer</code> is PayAI&rsquo;s
              current fee payer, read live from the facilitator&rsquo;s <code>/supported</code>{" "}
              endpoint, so the agent never needs SOL for gas, only the stablecoin it pays with.
            </p>
          </Protocol>

          <Protocol
            id="settlement"
            kicker="Assets"
            title="USDC and AUD stablecoins, one challenge"
            status={{ s: "live", label: "Live" }}
            why="Agents don't need to hold a particular token. A USD-native agent pays in USDC, an Australian one can pay in AUD and skip the FX round-trip, and both hit the same endpoint at the same listed price."
            code={SETTLE_CODE}
            codeLabel="accepts[] on the live ABN lookup"
            links={[
              { href: "/stables", label: "AUD stablecoin reference" },
              { href: "https://milypay.xyz/api/status", label: "Live payment rails" },
            ]}
          >
            <p>
              Each 402 offers the same price in five Solana stablecoins:{" "}
              <strong className="text-fg">AUDD</strong>, <strong className="text-fg">AUDM</strong> and{" "}
              <strong className="text-fg">dAUD</strong> for AUD-native settlement, plus{" "}
              <strong className="text-fg">USDC</strong> and <strong className="text-fg">USDT</strong> for
              compatibility with USD x402 wallets. The wallet chooses which one to pay with, and
              Milypay matches the payment on both asset and network.
            </p>
            <p>
              Prices are set per call (for example 0.002 for an ABN lookup). Settlement lands on
              Solana in whichever stablecoin was used.
            </p>
          </Protocol>

          <Protocol
            id="mpp"
            kicker="Second rail"
            title="MPP on Tempo"
            status={{ s: "live", label: "Live · opt-in" }}
            why="Agents built on the Machine Payments Protocol can pay Milypay without a Solana wallet. Because MPP only switches on when a client asks for it, default x402 agents are never sent somewhere they don't expect."
            code={MPP_CODE}
            codeLabel="Opt in with ?rail=mpp"
            links={[
              { href: "https://mpp.dev", label: "mpp.dev" },
              { href: "https://explore.tempo.xyz", label: "Tempo explorer" },
            ]}
          >
            <p>
              The paid API also speaks the{" "}
              <strong className="text-fg">Machine Payments Protocol (MPP)</strong>. Add{" "}
              <code>?rail=mpp</code>, send <code>X-Payment-Rail: mpp</code>, or present an{" "}
              <code>Authorization: Payment</code> credential, and you get a{" "}
              <code>WWW-Authenticate: Payment</code> challenge with <code>method=&quot;tempo&quot;</code>{" "}
              and <code>intent=&quot;charge&quot;</code>, payable in pathUSD on Tempo mainnet (
              <code>eip155:4217</code>).
            </p>
            <p>
              x402 itself on Tempo is not switched on: it waits until a facilitator settles{" "}
              <code>eip155:4217</code>. Without a rail hint, every request gets the Solana x402
              challenge above.
            </p>
          </Protocol>
        </div>
      </section>

      {/* Integration surfaces */}
      <section className="mx-auto max-w-6xl space-y-6 px-6 py-16">
        <div className="max-w-2xl">
          <p className="fig-label">Integration</p>
          <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">How agents call us</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Every surface below uses the same rule: the free, throttled demo lives at{" "}
            <code>milypay.xyz/api/*</code>, and the paid x402 API lives at the root of{" "}
            <code>api.milypay.xyz</code>.
          </p>
        </div>

        <Protocol
          id="mcp"
          kicker="Model Context Protocol"
          title="MCP server: npx milypay mcp"
          status={{ s: "live", label: "Live · stdio" }}
          why="An assistant like Claude or Cursor gets 30+ typed Milypay tools (ABN, ASIC, addresses, ABS, transit, energy, phone and more) without anyone writing glue code. Add a wallet key and the same tools pay for themselves."
          code={MCP_CODE}
          codeLabel="MCP client config"
          links={[
            { href: "https://modelcontextprotocol.io", label: "modelcontextprotocol.io" },
            { href: "/mcp", label: "milypay.xyz/mcp" },
            { href: "/quickstart", label: "Quickstart" },
            { href: "https://www.npmjs.com/package/milypay", label: "npm: milypay" },
          ]}
        >
          <p>
            The <code>milypay</code> npm package ships a stdio MCP server. Run{" "}
            <code>npx -y milypay mcp</code> from any MCP client. There is no hosted HTTP MCP
            endpoint; the server runs next to the agent so the wallet key never leaves the machine.
          </p>
          <p>
            Set <code>MILYPAY_HOST=demo</code> for the free demo, or <code>MILYPAY_HOST=api</code>{" "}
            with <code>MILYPAY_PRIVATE_KEY</code> to call the paid API over x402.
          </p>
        </Protocol>

        <Protocol
          id="cli"
          kicker="Command line"
          title="milypay CLI"
          status={{ s: "live", label: "Live" }}
          why="Coding agents and shell-based agents already know how to run a command and read JSON. The CLI handles the 402, the signature and the retry, so one line returns paid data."
          code={CLI_CODE}
          codeLabel="Terminal"
          links={[
            { href: "https://www.npmjs.com/package/milypay", label: "npm: milypay" },
            { href: "/agents.md", label: "agents.md · CLI" },
          ]}
        >
          <p>
            <code>npx milypay</code> covers every dataset: ABN and ASIC, ABS statistics, live
            transit, NEM electricity prices, phone line checks, Uber quotes, domains and MoneyGram
            wallet funding. It prints JSON to stdout.
          </p>
          <p>
            It uses the free demo host by default. Add <code>--api</code> and a Solana key in{" "}
            <code>MILYPAY_PRIVATE_KEY</code> to pay over x402.
          </p>
        </Protocol>

        <Protocol
          id="sdk"
          kicker="TypeScript"
          title="milypay-sdk"
          status={{ s: "live", label: "Live" }}
          why="Agent frameworks written in TypeScript get typed methods and a receipt on every paid response, instead of hand-rolling 402 parsing and Solana transaction signing."
          code={SDK_CODE}
          codeLabel="TypeScript"
          links={[
            { href: "https://www.npmjs.com/package/milypay-sdk", label: "npm: milypay-sdk" },
            { href: "https://github.com/milysecond/milypay/tree/main/packages/sdk", label: "Source" },
          ]}
        >
          <p>
            <code>milypay-sdk</code> wraps the same API in typed namespaces such as{" "}
            <code>business</code>, <code>company</code>, <code>address</code>, <code>abs</code>,{" "}
            <code>transit</code>, <code>energy</code>, <code>domains</code> and <code>ramp</code>.
          </p>
          <p>
            Give it a base58 Solana key and <code>host: &quot;api&quot;</code> and it answers each 402,
            signs the payment and returns the data with a <code>$receipt</code>.
          </p>
        </Protocol>

        <Protocol
          id="http"
          kicker="Plain HTTP"
          title="HTTP 402 + OpenAPI 3.1"
          status={{ s: "live", label: "Live" }}
          why="Nothing proprietary sits between an agent and the data. Any language with an HTTP client and any x402 library can integrate, and tools that import OpenAPI can generate a client in one step."
          code={HTTP_CODE}
          codeLabel="curl"
          links={[
            { href: "/openapi.json", label: "openapi.json" },
            { href: "https://spec.openapis.org/oas/v3.1.0", label: "OpenAPI 3.1" },
            { href: "/docs", label: "Docs" },
          ]}
        >
          <p>
            Under the CLI, MCP server and SDK it is plain HTTP. Call any endpoint, read the 402,
            pay, retry. Errors come back as JSON with a code and a docs link, and rate limits send{" "}
            <code>retry-after</code>.
          </p>
          <p>
            The whole API is described in an OpenAPI 3.1 document at{" "}
            <code>milypay.xyz/openapi.json</code>.
          </p>
        </Protocol>
      </section>

      {/* Discovery */}
      <section className="border-y border-border-brand bg-card/40">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-16">
          <div className="max-w-2xl">
            <p className="fig-label">Discovery</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">How agents find us</h2>
          </div>

          <Protocol
            id="discovery"
            kicker="Machine-readable"
            title="agents.md, llms.txt and well-known files"
            status={{ s: "live", label: "Live" }}
            why="An agent can work out what Milypay offers, what it costs and how to pay by reading a few plain files, before it spends anything."
            code={DISCOVERY_CODE}
            codeLabel="Discovery endpoints"
            links={[
              { href: "https://agents.md", label: "agents.md" },
              { href: "https://llmstxt.org", label: "llms.txt" },
              { href: "https://www.rfc-editor.org/rfc/rfc9727", label: "RFC 9727 api-catalog" },
            ]}
          >
            <p>
              <code>/agents.md</code> is the full agent guide, <code>/llms.txt</code> is the short
              LLM summary and <code>/llms-full.txt</code> lists every endpoint with example
              responses.
            </p>
            <p>
              For machines there is an x402 manifest at <code>/.well-known/x402</code>, an RFC
              9727 API catalog at <code>/.well-known/api-catalog</code>, an MCP server card and
              the OpenAPI document.
            </p>
          </Protocol>

          <Protocol
            id="bazaar"
            kicker="x402 extension"
            title="Bazaar metadata in every 402"
            status={{ s: "live", label: "Live" }}
            why="The 402 itself describes the service, so an x402 index or a curious agent can catalogue an endpoint just by calling it, with no separate listing form."
            code={BAZAAR_CODE}
            codeLabel="Decoded challenge (excerpt)"
            links={[
              { href: "https://github.com/x402-foundation/x402/blob/main/docs/extensions/bazaar.mdx", label: "Bazaar extension spec" },
              { href: "https://agentic.market", label: "agentic.market" },
            ]}
          >
            <p>
              Each challenge carries the x402 <strong className="text-fg">Bazaar</strong> extension (
              <code>extensions.bazaar</code>) with the endpoint&rsquo;s input and output schema, plus
              resource metadata: <code>serviceName</code>, <code>tags</code> and{" "}
              <code>iconUrl</code>.
            </p>
            <p>
              That is the metadata x402 discovery indexes such as agentic.market read. A{" "}
              <code>milypayFunding</code> extension tells a wallet with no balance how to top up
              first (MoneyGram funds the wallet; it never settles the 402).
            </p>
          </Protocol>
        </div>
      </section>

      {/* Solana.ai */}
      <section id="solana-ai" className="scroll-mt-20 mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="fig-label">Ecosystem</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">
              Part of the agent economy on <span className="brand-gradient-text">Solana</span>
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted">
              <p>
                <a href="https://solana.ai" target="_blank" rel="noopener noreferrer" className="text-fg underline underline-offset-4 hover:text-brand-green">
                  Solana.ai
                </a>{" "}
                is the Solana Foundation&rsquo;s site for AI on Solana, &ldquo;Open Infrastructure for
                Intelligence&rdquo;. It brings together Solana Confidential Compute, pay.sh, Payment
                Channels, the Solana Developer Platform and the Solana AI Toolkit (the Solana MCP
                server, Solana Agent Kit, Agent Registry and Agent Skills), alongside the teams
                building AI products on Solana.
              </p>
              <p>
                Its pitch is that Solana is the network agents pay on: a payment settles in about
                200 milliseconds for a fraction of a cent, so an agent can pay for each API call as
                it makes it, over x402.
              </p>
              <p>
                Milypay is that pattern applied to Australian data. Every call is an x402 payment
                on Solana, settled through PayAI, which appears among the ecosystem teams on
                solana.ai. If your agent already pays per call on Solana, it can call Milypay with
                no extra setup.
              </p>
              <p className="text-xs">
                Milypay is independent. It isn&rsquo;t listed on solana.ai and has no partnership
                with or endorsement from the Solana Foundation; we link to it as the best map of
                the stack we build on.
              </p>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {SOLANA_AI_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block h-full p-4 transition hover:border-brand-green/40"
                >
                  <span className="font-display text-base tracking-tight text-fg">{l.label} ↗</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{l.desc}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="card relative overflow-hidden p-10 text-center md:p-14">
          <div className="hero-glow absolute inset-0 -z-10" />
          <h2 className="font-display mx-auto max-w-2xl text-3xl tracking-tight md:text-4xl">
            Pick a protocol and make your first call.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">
            Start free on the demo host, then point the same code at api.milypay.xyz when
            you&rsquo;re ready to pay per call.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/quickstart" className="btn-primary">
              Quickstart
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-border-brand bg-bg px-6 py-3 text-sm font-semibold text-fg transition hover:border-brand-green/40"
            >
              Try the live demo
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
