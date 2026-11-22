/**
 * Markdown bodies for Accept: text/markdown negotiation (acceptmarkdown.com / is-agentic).
 */

export const MD_404 = `# 404 Not Found — milypay.xyz

This path does not exist on Milypay.

## Where to look next

- [Home](https://milypay.xyz/)
- [Agents guide](https://milypay.xyz/agents.md)
- [llms.txt](https://milypay.xyz/llms.txt)
- [OpenAPI](https://milypay.xyz/openapi.json)
- [x402 catalogue](https://milypay.xyz/.well-known/x402)
- [API catalog](https://milypay.xyz/.well-known/api-catalog)
- [Sitemap](https://milypay.xyz/sitemap.xml)
- [Docs](https://milypay.xyz/docs)
- [MCP](https://milypay.xyz/mcp)
- [Contact](https://milypay.xyz/contact)

Paid data lives on \`https://api.milypay.xyz\` and returns HTTP 402 (not 404) when payment is required.
`;

export const MD_HOME = `# Milypay

Milypay is the x402 service provider for the Australian market. AI agents get pay-per-call access to Australian data (ABN, ASIC, G-NAF, ABS, transit, energy, and more) settled in USDC/USDT/AUD stables on Solana. No API keys, no signup. A Milysec company.

## When to use Milypay

- You need **Australian business, company, address, super, weather, BSB, postage, ABS stats, transit, or NEM energy** data in an agent loop
- You want **pay-per-call** instead of API keys and monthly plans
- You speak **HTTP 402 / x402**, CLI, SDK, or MCP

## Start here

- Agents: https://milypay.xyz/agents.md
- OpenAPI: https://milypay.xyz/openapi.json
- x402: https://milypay.xyz/.well-known/x402
- Demo API: \`curl https://milypay.xyz/api/au-business/abn/51824753556\`
- CLI: \`npx milypay abn 51824753556\`
- MCP: \`npx milypay mcp\`

## Site map

- /docs · /quickstart · /demo · /stables · /protocols · /lazorkit · /fund · /dashboard · /about · /contact · /privacy · /mcp
`;

export const MD_ABOUT = `# About Milypay

Milypay is built by **Milysec** for AI agents that need Australian public and commercial data without signing up for traditional API keys.

We expose ABR business identity, ASIC company data, G-NAF addresses, ATO super funds, BOM weather, Australia Post rates, AusPayNet BSBs, ABS statistics, GTFS-RT transit, and AEMO NEM electricity over the open **x402** payment protocol on Solana.

## Who it is for

- Autonomous agents and LLM tool-runners
- Developers building AU fintech, compliance, logistics, or research agents
- Platforms that want AUD-native micropayments (AUDD and other AUD stables) plus USDC/USDT

## Company

- Product: https://milypay.xyz
- Parent: https://milysec.com
- Contact: https://milypay.xyz/contact · gm@milysec.com

Milypay does not replace government sources; it packages them for agent-native payment and discovery.
`;

export const MD_PRIVACY = `# Privacy — Milypay

**Last updated:** 2026-08-22

Milypay (operated by Milysec) provides pay-per-call APIs. We minimize personal data.

## What we process

- **API requests:** path, query parameters you send, timestamps, response status. Do not send secrets or unnecessary personal information in query strings.
- **Payments:** on-chain settlement via x402 / Solana (public ledger). We do not store card numbers.
- **Website analytics:** Google Analytics (GA4) on milypay.xyz for aggregate traffic.
- **Contact form:** name, email, and message if you submit /contact.
- **MoneyGram:** if you use /fund, MoneyGram processes KYC under their privacy policy; Milypay only initiates a session.

## What we do not do

- We do not sell personal data.
- We do not require accounts for core API access.
- We do not use API query contents for advertising profiles.

## Retention

Server logs are retained for operations and abuse prevention for a limited period. On-chain payments remain on Solana permanently.

## Your choices

- Prefer the free demo host with rate limits, or paid API with a wallet you control.
- Contact gm@milysec.com for privacy requests.

## Contact

Milysec / Milypay — https://milypay.xyz/contact — gm@milysec.com
`;

export const MD_CONTACT = `# Contact Milypay

Talk to the Milypay team about listing an Australian API, integrating AUD stablecoins, agent payments on x402, or partnership.

- Form: https://milypay.xyz/contact
- Email: gm@milysec.com
- Parent company: https://milysec.com
- Agents docs: https://milypay.xyz/agents.md
- Status: https://milypay.xyz/status

We read every message. For technical integration, include your use case (agent framework, expected volume, endpoints).
`;

export const MD_PROTOCOLS = `# Milypay protocols

Every open protocol Milypay supports. HTML: https://milypay.xyz/protocols

| Protocol | Status | How |
| --- | --- | --- |
| x402 v2 (Solana) | Live, default | Unpaid GET on https://api.milypay.xyz returns 402 + base64 \`PAYMENT-REQUIRED\`. Scheme \`exact\`, network \`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp\`. Retry with \`PAYMENT-SIGNATURE\` (v2) or \`X-PAYMENT\` (v1). PayAI facilitator verifies/settles; \`extra.feePayer\` = PayAI's sponsored fee payer (from /supported). |
| Settlement assets | Live | Same price offered in AUDD, AUDM, dAUD (AUD) and USDC, USDT (USD) on Solana; wallet picks. |
| MPP (Tempo) | Live, opt-in | \`?rail=mpp\` or \`X-Payment-Rail: mpp\` or \`Authorization: Payment\` -> \`WWW-Authenticate: Payment\` method=tempo intent=charge, pathUSD on eip155:4217. x402-on-Tempo not enabled. |
| MCP | Live (stdio) | \`npx -y milypay mcp\` (MILYPAY_HOST=demo, or api + MILYPAY_PRIVATE_KEY) |
| CLI | Live | \`npx milypay abn 51824753556\` · \`npx milypay --api ...\` |
| SDK | Live | \`npm i milypay-sdk\` |
| HTTP + OpenAPI 3.1 | Live | https://milypay.xyz/openapi.json · demo https://milypay.xyz/api/* · paid https://api.milypay.xyz |
| Discovery | Live | /agents.md · /llms.txt · /llms-full.txt · /.well-known/x402 · /.well-known/api-catalog |
| x402 Bazaar extension | Live | \`extensions.bazaar\` + resource serviceName/tags/iconUrl on every 402 |

## Solana.ai

Solana.ai (https://solana.ai) is the Solana Foundation's site for AI on Solana: Confidential Compute, pay.sh, Payment Channels, the Developer Platform and the Solana AI Toolkit. Milypay uses the pay-per-call x402 pattern it describes, settled via PayAI on Solana. Milypay is independent and is not listed on or endorsed by solana.ai.
`;

export const MD_LAZORKIT = `# LazorKit and Milypay

HTML: https://milypay.xyz/lazorkit

**Milypay settles what LazorKit authorizes.** Biometrics in, scoped spend out, auditable on-chain. LazorKit is the authentication and permission layer Milypay sits on top of. Once a payment is authorized, Milypay settles it for Australian data over x402.

This is architecture and positioning, not a claim that milypay.xyz already ships a LazorKit wallet integration. The live app settles via PayAI. A LazorKit wallet is not wired into production today.

## What LazorKit is

Open-source Solana passkey smart-wallet infrastructure (MIT). Users authenticate with Face ID, Touch ID or Windows Hello. Official docs call it an execution layer: authentication, permission enforcement, fee routing and transaction submission. The Milypay founder helped co-build it and ship protocol v1 to mainnet. It is not a finished product he personally guarantees.

- Site: https://www.lazorkit.com/
- Docs: https://docs.lazorkit.com/
- GitHub: https://github.com/lazor-kit
- License: MIT

## Status (checked 23 November 2026, Australia/Melbourne)

- Protocol v1 is live on Solana mainnet (program LazorjRF…). The public monorepo still says "Pre-audit. Do not use in production."
- Protocol v2 was audited by Accretion in a Solana Foundation engagement (report A26SFR1, February 2026; the project reports all 17 findings remediated). v2 is live on devnet. The v2 mainnet program (LazorFroi…) was not deployed as of 23 November 2026.
- Official protocol dashboard, all-time mainnet v1, complete through 23 November 2026, 8:46am Australia/Melbourne: 450 wallets created (425 passkey), 3,974 transactions (3,942 successful). https://lazorkit-protocol-dashboard.vercel.app
- Marketing figures on lazorkit.com were not used because they do not match the dashboard.

## Features

- Passkey auth (Face ID, Touch ID, Windows Hello)
- Gasless transactions via a Kora paymaster
- Session keys with on-chain spending limits
- Roles in protocol v2: Owner, Admin, and Delegate (SDK name: Spender). v1 did not check rank on Execute.
- Scoped delegation for AI agents (program, amount, time; revocable)

## Official Solana starter templates (unpaid catalog listing)

Listed as community templates in the Solana Foundation catalog (https://github.com/solana-foundation/templates/blob/main/TEMPLATES.md):

- Next.js: https://templates.solana.com/lazorkit-starter-next
- Expo: https://templates.solana.com/lazorkit-starter-expo
- Vite (also listed): https://templates.solana.com/lazorkit-starter-vite

lazorkit.com also states support from the Solana Foundation.
`;

export function markdownForPath(pathname: string): string | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  switch (p) {
    case "/":
    case "":
      return MD_HOME;
    case "/about":
      return MD_ABOUT;
    case "/privacy":
      return MD_PRIVACY;
    case "/contact":
      return MD_CONTACT;
    case "/protocols":
      return MD_PROTOCOLS;
    case "/lazorkit":
      return MD_LAZORKIT;
    default:
      return null;
  }
}

export function wantsMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const a = accept.toLowerCase();
  if (a.includes("text/markdown")) return true;
  if (a.includes("text/x-markdown")) return true;
  return false;
}

export function wantsJson(accept: string | null): boolean {
  if (!accept) return false;
  return accept.toLowerCase().includes("application/json");
}
