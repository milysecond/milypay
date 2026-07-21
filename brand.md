# MilyPay — Brand

> **MilyPay** — agent-native payments & Australian data on the x402 rail. Settled in **AUDD**.
> A **Milysec** company.

MilyPay is Milysec's payments arm: an [x402](https://x402.org) service provider for the
Australian market, listed on [pay.sh](https://pay.sh) and settling through the **PayAI**
x402 facilitator. It gives AI agents user-approved, pay-per-call access to Australian data
priced in **AUDD** (the regulated, 1:1 AUD-backed, AFSL-licensed AUD-native stablecoin) —
the one provider in the pay.sh catalog that owns 🇦🇺 Australia while everyone else is
horizontal. Underpins the **AUDDapt grant** pilot: AUDD as the first AUD-native settlement
currency on the agentic payments stack (3+ AU APIs priced in AUDD, reference impl, agent demo).

## Positioning

- **Who it's for:** AI agents and agent developers needing Australian data (business identity,
  property, address, weather, civic) and AUD-denominated micropayments.
- **The gap:** Every pay.sh provider today is global/horizontal (`merit-systems/*`,
  `paysponge/*`, `solana-foundation/*`). None serve Australia-specific data or AUD rails.
- **One-liner:** *The settlement authority for agent payments in Australia.*
- **Catalog namespace:** `milysec/milypay` (or per-vertical: `milysec/au-business`, `milysec/au-data`).

## Voice & tone

- Confident, technical, infrastructural — speaks to agent-devs, not consumers.
- Plain and exact. No hype words ("revolutionary", "seamless"). Lead with what it does.
- Dry Australian directness is on-brand; novelty/cute is not.
- Parent inheritance from Milysec: *Fast. Web. App.* → MilyPay extends with *Pay.*

## Color palette (commercial light shell — Decal-inspired, Solana-accented)

Light-first for decision-makers. Green reserved for pay/live states, not full-page neon.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F9F8F6` | Warm paper page background |
| `--bg-secondary` | `#F6F5F4` | Alternating section wash |
| `--bg-cream` | `#F8F5E8` | Product mock / highlight panels |
| `--bg-card` | `#FFFFFF` | Cards |
| `--fg` | `#2B2B2B` | Body / headings |
| `--muted` | `#6B6560` | Secondary text |
| `--border` | `#E3E0DE` | Borders |
| `--cta` | `#292929` | Primary button fill (charcoal) |
| `--cta-fg` | `#FFFFFF` | Primary button text |
| `--brand-green` | `#0D9B6A` | Text-safe green (prices, success, Pay) |
| `--brand-green-bright` | `#14F195` | Dots, bright accents (Solana) |
| `--brand-purple` | `#6D28D9` | Code / secondary accent |

## Typography

- **Display / headings:** Inter 600, tight tracking (−0.03em) — commercial product tone
- **Body / UI:** Inter via `next/font`
- **Mono:** system mono for API mocks and code
- **Legacy:** MoonWalk OTF kept in `/fonts` but not default for marketing UI
- **Type scale:** H1 ~60 · H2 36 · H3 24 · Body 16 · Small 14 (px)

## Logo

- Inherit Milysec mark: `milysec-logo.svg` / `milysec-logo-original.png` (from milysec.com).
- MilyPay lockup: Milysec mark + "MilyPay" wordmark in Inter semibold; "Pay" in brand-green.

## Domains

- `milypay.xyz` (primary — $1.99/yr, crypto-native, ecosystem-fit) · `milypay.com` ($11, optional canonical/redirect) · `milypay.au` (AU market) · `milypay.ai` (optional AI hero)
- Alias `pay.milysec.com` → MilyPay.

## Don'ts

- Don't go full neon-on-black for marketing — light commercial shell is the default.
- Don't drop AUDD / x402 / agent positioning when borrowing layout patterns (e.g. Decal).
- Don't lean on kangaroo/novelty motifs; MilyPay is infrastructure, the AU angle is in the
  data/rails, not in mascots.
- Don't foreground "security/sec" — this is the payments line, not the Milysec security product.
- No emoji or hashtags in marketing UI.
