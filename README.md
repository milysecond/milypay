# MilyPay

Agent-native payments and Australian data on the [x402](https://x402.org) protocol, settled in AUD stablecoins. A [Milysec](https://milysec.com) company.

MilyPay is the x402 service provider built for Australia. AI agents get pay-per-call access to Australian government data, settled in AUDD on Solana via the [PayAI](https://docs.payai.network/x402) facilitator and listed on [Pay.sh](https://pay.sh). No API keys, no signup.

- Site: https://milypay.xyz
- API: https://api.milypay.xyz
- Live demo: https://milypay.xyz/demo
- For agents: https://milypay.xyz/agents.md

## Services

| Endpoint | Source | Status |
| --- | --- | --- |
| `au-business` | ABR ABN Lookup (ATO) | Live |
| `au-company` | ASIC Company Register (data.gov.au) | Live |
| `au-address` | G-NAF (Geoscape, 16.9M addresses) | Live |
| `au-super` | Super Fund Lookup (ATO) | Live |
| `au-weather` | Open-Meteo (BOM ACCESS-G), by address or coordinate | Live |
| `au-postage` | Australia Post (PAC), parcel rates between postcodes | Live |
| `au-tracking` | Australia Post Shipping & Tracking | Pending merchant key |

### Examples

```bash
# Business identity by ABN
curl https://api.milypay.xyz/au-business/abn/33051775556

# Business by ACN, or name search
curl https://api.milypay.xyz/au-business/acn/051775556
curl "https://api.milypay.xyz/au-business/search?name=woolworths"

# Address validation / search / geocoding
curl "https://api.milypay.xyz/au-address/validate?q=1 bligh st sydney"
curl "https://api.milypay.xyz/au-address/search?q=120 collins st melbourne"
curl "https://api.milypay.xyz/au-address/geocode?q=200 adelaide st brisbane"

# Super fund by ABN (fund name, status, type, USIs)
curl https://api.milypay.xyz/au-super/abn/65714394898
```

**Payments are live on the API host.** A request to `https://api.milypay.xyz/...` without payment returns `HTTP 402` with a `PAYMENT-REQUIRED` challenge (settled in AUDD on Solana via the PayAI facilitator); the agent pays and retries. The same endpoints on the website host (`https://milypay.xyz/api/...`) and the live demo remain free and per-IP rate limited.

## Stack

- Next.js 16 (App Router) on Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare)
- Turso (libSQL) for the G-NAF address index, queried over the HTTP pipeline API
- PayAI x402 facilitator for AUDD settlement on Solana
- Resend for transactional email
- Tailwind CSS v4

## Project layout

```
src/app/                  pages (home, /demo, /stables, /contact) + metadata
src/app/api/au-business/  ABN / ACN / name-search routes (ABR)
src/app/api/au-address/   validate / search / geocode routes (G-NAF via Turso)
src/lib/abr.ts            ABR ABN Lookup client
src/lib/gnaf.ts           Turso/libSQL address client (FTS5)
src/lib/x402.ts           PayAI x402 payment gate (+ per-IP throttle)
public/agents.md          agent-facing API guide
public/llms.txt           llmstxt.org discovery file
keepwarm/                 cron Worker that keeps the Turso DB hydrated
```

## Local development

```bash
pnpm install
pnpm dev                  # Next dev server
pnpm cf:build             # OpenNext build for Cloudflare
pnpm cf:deploy            # build + deploy the Worker
```

## Configuration

Non-secret config lives in `wrangler.jsonc` (`vars`). Secrets are set with `wrangler secret put` and are never committed:

| Secret | Purpose |
| --- | --- |
| `ABR_GUID` | ABN Lookup web-services authentication GUID |
| `SFL_GUID` | Super Fund Lookup GUID (pending) |
| `TURSO_AUTH_TOKEN` | Turso database token |
| `RESEND_API_KEY` | Contact-form email |

x402 settlement (when enabled): `X402_ENABLED=true`, `PAY_TO_WALLET`, `AUDD_MINT`.

## Data sources and attribution

- Business data: Australian Business Register (ABR), Australian Taxation Office.
- Address data: Incorporates or developed using G-NAF (c) Geoscape Australia, licensed under the open G-NAF licence. Per-call lookups only; no bulk redistribution.

## License

Proprietary. (c) Milysec Pty Ltd.
