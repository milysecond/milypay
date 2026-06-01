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

## Color palette (inherited from Milysec — Solana-native)

| Token | Hex | Use |
|---|---|---|
| `--brand-green` | `#14F195` | Primary — CTAs, highlights, the "pay" accent |
| `--brand-purple` | `#9945FF` | Secondary — accents, gradients |
| `--bg` | `#0A0F0A` | Dark page background |
| `--bg-card` | `#0F1410` | Cards / sections |
| `--fg` | `#FFFFFF` | Body text / headings on dark |
| `--bg-light` | `#F0F4F0` | Light-mode page background |
| Brand gradient | `linear-gradient(to right, #14F195, #9945FF)` | Hero, key marks |

These are the Solana brand colors — deliberate: x402 + pay.sh are Solana-ecosystem, so the
palette signals "agent payments on crypto rails" at a glance.

## Typography

- **Display / headings:** `MoonWalk` (custom OTF — `/fonts/MoonWalk.otf` from milysec.com)
- **Body / UI:** `Inter` (Google Fonts), via `next/font`
- **Type scale:** Display 96 · H1 60 · H2 36 · H3 24 · Body 16 · Small 14 (px)

## Logo

- Inherit Milysec mark: `milysec-logo.svg` / `milysec-logo-original.png` (from milysec.com).
- MilyPay lockup: Milysec mark + "MilyPay" wordmark in MoonWalk, green-on-dark, with the
  green→purple gradient reserved for the hero and the "x402" / "Pay" emphasis.

## Domains

- `milypay.xyz` (primary — $1.99/yr, crypto-native, ecosystem-fit) · `milypay.com` ($11, optional canonical/redirect) · `milypay.au` (AU market) · `milypay.ai` (optional AI hero)
- Alias `pay.milysec.com` → MilyPay.

## Don'ts

- Don't repaint the palette — it's inherited equity and ecosystem-correct.
- Don't lean on kangaroo/novelty motifs; MilyPay is infrastructure, the AU angle is in the
  data/rails, not in mascots.
- Don't foreground "security/sec" — this is the payments line, not the Milysec security product.
