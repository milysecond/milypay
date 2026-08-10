# Australian data APIs that agents can pay for

Most Australian open data is free, messy, or stuck behind human logins. Agents need something simpler: a price, a payment, a JSON response.

**Milypay** is Milysec's x402 service layer for Australia. Request an endpoint. Get HTTP 402 with a price in AUD stablecoins. Pay once on Solana. Get the data back in the same round-trip.

No accounts. No API keys. Payment is the auth.

## Why this exists

Agents are already shopping for data on their own. The missing piece in Australia is not another dashboard — it is a clean pay-per-call surface that speaks the same language as agent wallets.

Milypay sits on the x402 rail and settles on Solana. Demo host is free and throttled for exploration. The paid API host settles per call.

## What you can call today

- **Business identity** — ABN / ACN lookup from the ABR
- **Company register** — ASIC open data, plus official company extracts
- **Addresses** — G-NAF validate, search, geocode (16.9M)
- **Super funds** — ATO Super Fund Lookup
- **Weather** — Australian forecast by address or coordinates
- **BSB** — AusPayNet bank and branch directory
- **Postage** — Australia Post domestic and international rates
- **ABS statistics** — CPI, wages, 1,200+ SDMX dataflows
- **Transit** — live GTFS-Realtime for QLD, SA, VIC, NSW
- **Energy** — AEMO NEM wholesale prices and demand

Prices start from a fraction of a cent per call. ASIC extracts are the premium path.

## How agents integrate

Four paths, same backend:

1. **CLI** — npx milypay for ABN, NEM prices, transit, CPI, and more
2. **MCP** — npx milypay mcp into Claude or Cursor
3. **SDK** — drop-in client that retries on 402
4. **Raw HTTP** — any x402-aware wallet against the paid API host

## Settlement

- Network: Solana via PayAI facilitator
- AUD-native: AUDD, AUDM, dAUD
- Also accepted: USDC, USDT
- Receipts on-chain

## The loop

Request → 402 challenge → wallet pays → JSON returns.

That is the whole product.

## Try it

Start on the free demo host, then flip to paid when you are ready.

Milypay lives at milypay.xyz — demo, docs, and agent guide included.

Milypay is a Milysec product. Built for agents that need Australian data without Australian paperwork.
