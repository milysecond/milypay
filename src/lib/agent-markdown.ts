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

- /docs · /quickstart · /demo · /stables · /fund · /dashboard · /about · /contact · /privacy · /mcp
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
