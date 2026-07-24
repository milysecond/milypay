# Milypay — Brand

> **Milypay** — agent-native payments & Australian data on the x402 rail. Settled in **AUDD**.
> A **Milysec** company.

Milypay is Milysec's payments arm: an [x402](https://x402.org) service provider for the
Australian market, listed on [pay.sh](https://pay.sh) and settling through the **PayAI**
x402 facilitator. It gives AI agents user-approved, pay-per-call access to Australian data
priced in **AUDD** (the regulated, 1:1 AUD-backed, AFSL-licensed AUD-native stablecoin) —
the one provider in the pay.sh catalog that owns Australia while everyone else is
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
- Parent inheritance from Milysec: *Fast. Web. App.* → Milypay extends with *Pay.*

## Design system (lab — shared with milysec.com)

Dark-first research-lab shell. Sharp geometry, mono labels, green primary actions.
Light mode available via theme toggle.

| Token | Hex / value | Use |
|---|---|---|
| `--bg` (dark) | `#070A08` | Page background |
| `--bg` (light) | `#F7F8F7` | Page background |
| `--bg-card` (dark) | `#0C100D` | Lab panels |
| `--bg-card` (light) | `#FFFFFF` | Cards |
| `--fg` | white / `#0F172A` | Body / headings |
| `--muted` | white/55 / `#64748B` | Secondary text |
| `--border` | white/8% / slate 10% | Borders |
| `--brand-green` / primary | `#08D592` | CTAs, live, prices, Pay |
| `--brand-green-bright` | `#14F195` | Bright accents |
| `--brand-purple` | `#9C32DF` | Code / secondary accent |

### Surfaces & components

- **Lab panel** (`.lab-panel` / `.card`): bordered figure cell, no large radius
- **Section label** (`.section-label` / `.eyebrow`): mono uppercase tracking
- **Buttons:** `.btn-primary` (green), `.btn-mono` / `.btn-mono-solid` (uppercase mono)
- **Hero:** `.hero-wash` + `.lab-grid` + terminal line whisper
- **Quote band:** `.quote-band` solid green closing CTA
- **Partner cells:** density wall for stack / proof

## Typography

Shared stack with milysec.com:

| Role | Face | Notes |
|---|---|---|
| **Logo** | MoonWalk (OTF) | Class `font-logo`. Letter-spacing **−0.05em**. Logo only. |
| **Headings** | **Bricolage Grotesque** | Class `font-display`. Weights 500–800, tracking −0.03em. |
| **Body / UI** | **Inter** | Default sans. Weights 400 / 500 / 600. |
| **Mono** | System mono | Labels, API mocks, code, metrics. |

## Logo

- Inherit Milysec mark: `milysec-logo.svg` / `milysec-logo-original.png` (from milysec.com).
- Milypay lockup: Milysec mark + "Milypay" wordmark in **MoonWalk** (`font-logo`), "pay" in brand-green.

## Domains

- `milypay.xyz` (primary) · `milypay.com` (optional) · `milypay.au` · `milypay.ai`
- Alias `pay.milysec.com` → Milypay.

## Don'ts

- Don't use charcoal pill CTAs from the old Decal shell — use lab mono / green.
- Don't drop AUDD / x402 / agent positioning when borrowing layout patterns.
- Don't lean on kangaroo/novelty motifs; the AU angle is in the data/rails.
- Don't foreground "security/sec" — this is the payments line, not the Milysec security product.
- No emoji or hashtags in marketing UI.
