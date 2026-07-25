# Milypay domain + Search Console

**Canonical host:** `https://milypay.xyz`  
**API host:** `https://api.milypay.xyz` (x402 paid traffic — never redirect to apex)  
**WWW:** `https://www.milypay.xyz` → 301 apex (middleware)

## Hosts

| Host | Role |
|------|------|
| `milypay.xyz` | Marketing site + free demo API under `/api/*` |
| `www.milypay.xyz` | 301 → apex |
| `api.milypay.xyz` | Production x402 API only |
| `*.workers.dev` | Preview — `X-Robots-Tag: noindex, nofollow` |

## Middleware (`src/middleware.ts`)

1. Force HTTPS (`x-forwarded-proto: http` → `https://…`)
2. `www` → apex (path preserved)
3. Preview hosts get `noindex`
4. `api.*` keeps CORS; never apex-redirected

## GSC checklist

1. Property: **Domain** `milypay.xyz` (covers www + api) *or* URL-prefix `https://milypay.xyz/` only.
2. Do **not** keep a separate preferred property for `https://www.milypay.xyz/` without redirect.
3. Sitemaps → submit `https://milypay.xyz/sitemap.xml`.
4. After deploy: validate **Duplicate without user-selected canonical** if it appears for www URLs.
5. Verification already in metadata: `AXY9Pei5H-GIw4Vyn1CV_OQPBxl0X0rwSIAAmqaVzHo` (+ HTML file rewrite `/googleb787913ba29840de.html`).

## Google Analytics (GA4)

| Field | Value |
|-------|-------|
| Account | MILYSEC (`accounts/384896008`) |
| Property | `properties/546984952` (`milypay.xyz`) |
| Measurement ID | `G-356WE6KS4T` |
| Tag | `src/app/layout.tsx` via `next/script` gtag.js |

Registry: `~/.openclaw/workspace/ga-measurement-ids.md`

## Cloudflare

- Enable **Always Use HTTPS** and **Automatic HTTPS Rewrites** on the zone (middleware is backup).
- Custom domains on worker `milypay`: apex, www, api (see `wrangler.jsonc` routes).

## Deploy

```bash
pnpm install
pnpm cf:deploy
```
