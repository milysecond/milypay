# Milypay for Agents

The complete way for AI agents to pay for Australian data. Milypay exposes Australian APIs over the x402 protocol, settled in AUD stablecoins on Solana, and discoverable through Pay.sh, a CLI, an MCP server, SDKs, and raw HTTP 402. No accounts, no API keys.

Agents and crawlers are welcome here. This document describes how to use Milypay programmatically. A Milysec company.

## Quickstart

Request any endpoint. If it returns `HTTP 402 Payment Required`, pay the quoted price in AUDD from an x402-aware wallet and the data returns in the same round-trip.

```
curl https://api.milypay.xyz/au-business/abn/51824753556
```

## Ways to integrate

### CLI

Call any endpoint from your terminal with the Milypay CLI.

- Free demo host by default (rate-limited)
- Paid API: `export MILYPAY_PRIVATE_KEY=…` then `npx milypay --api …`
- `npx milypay abn 51824753556`
- `npx milypay services`

### MCP (Model Context Protocol)

First-party Milypay MCP server. Agents get typed tools for every Australian data endpoint.

```bash
npx milypay mcp
```

Claude / Cursor config:

```json
{
  "mcpServers": {
    "milypay": {
      "command": "npx",
      "args": ["-y", "milypay", "mcp"],
      "env": { "MILYPAY_HOST": "demo" }
    }
  }
}
```

- Free demo host by default (`MILYPAY_HOST=demo`)
- Paid API: set `MILYPAY_PRIVATE_KEY` and `MILYPAY_HOST=api`
- Tools: lookup_abn, lookup_company, address_*, weather, bsb, postage, abs_*, transit_*, energy_nem*, company_report, …

### SDK

A drop-in x402 client for TypeScript and Python. Wrap fetch and get auto-paid responses.

- No manual payment plumbing
- Typed Australian data responses
- Handles the 402 retry and AUD settlement

### API (raw HTTP 402)

No SDK required. Any x402-aware client speaks directly to the endpoint.

- Standard HTTP, standard 402
- Asset AUDD, network Solana
- Same round-trip settlement

## Services

All services live under the `milysec/*` namespace on Pay.sh.

| Endpoint | What it returns | Price |
| --- | --- | --- |
| `GET /au-business/abn/{abn}` | Entity name, status, type, ACN, GST, business names, location | $0.002 / call |
| `GET /au-business/acn/{acn}` | Same, resolved from an ACN | $0.002 / call |
| `GET /au-business/search?name=` | Matching ABNs by business or entity name | $0.004 / call |
| `GET /au-company/acn/{acn}` | ASIC company: status, type, class, registration dates, former names (open data) | $0.002 / call |
| `GET /au-company/search?name=` | Companies matching a name (current + former names, open data) | $0.004 / call |
| `GET /au-company-report?acn=` | Official ASIC extract (directors, office, share capital). Paid DSP only | $12 / extract |
| `GET /au-address/validate?q=` | Canonical address, GNAF PID, geocode | $0.004 / call |
| `GET /au-address/search?q=` | Ranked address matches (autocomplete) | $0.004 / call |
| `GET /au-address/geocode?q=` | Latitude / longitude for an address | $0.004 / call |
| `GET /au-super/abn/{abn}` | Super fund name, status, type, complying status, USIs | $0.002 / call |
| `GET /au-weather?q={address}` | Current conditions + multi-day forecast for an Australian address | $0.001 / call |
| `GET /au-weather?lat={lat}&lng={lng}` | Same, by coordinate | $0.001 / call |
| `GET /au-postage?from={pc}&to={pc}&weight={kg}` | Australia Post parcel rates + services between postcodes | $0.002 / call |
| `GET /au-postage?country={cc}&weight={kg}` | International parcel rates | $0.002 / call |
| `GET /au-bsb/{bsb}` | BSB lookup: bank name, branch, address, state, postcode, services (P/E/H), merged/redirect flag | $0.002 / call |
| `GET /au-bsb/search?q=` | Search BSBs by bank name, branch, or suburb | $0.004 / call |
| `GET /au-abs/cpi` | Headline All groups CPI + QoQ/YoY | $0.003 / call |
| `GET /au-abs/dataflows?q=` | Search 1,200+ ABS dataflows | $0.002 / call |
| `GET /au-abs/data/{flow}` | ABS series (normalised observations) | $0.005 / call |
| `GET /au-transit/regions` | Live + planned AU transit regions | $0.001 / call |
| `GET /au-transit/{region}/vehicles` | GTFS-RT vehicles (`seq`/`sa`/`vic`/`nsw`, optional `?mode=`) | $0.003 / call |
| `GET /au-transit/{region}/trip-updates` | Delays / stop ETAs | $0.003 / call |
| `GET /au-transit/{region}/alerts` | Service alerts | $0.002 / call |
| `GET /au-transit/{region}/summary` | Counts + sample | $0.002 / call |
| `GET /au-energy/nem` | AEMO NEM wholesale price + demand (all regions) | $0.002 / call |
| `GET /au-energy/nem/{region}` | One NEM region (NSW1/VIC1 or NSW/VIC) | $0.002 / call |
| `GET /au-energy/notices` | AEMO market notices | $0.002 / call |
| `GET /au-phone?number=` | Phone line intel (valid/type/carrier, not identity) | $0.05 / call |

BSB numbers can be supplied with or without the hyphen: `012-002` or `012002` both work.

Transit regions: `seq` (QLD), `sa` (Adelaide), `vic` (metro|tram|bus|vline), `nsw` (buses|sydneytrains|metro|nswtrains|ferries|lightrail).

Base URL: `https://api.milypay.xyz`.

## How payment works

1. Your agent requests a Milypay endpoint, for example `GET https://api.milypay.xyz/au-business/abn/{abn}`.
2. Milypay answers with an x402 challenge: price, asset (AUDD), network (solana), and pay-to address.
3. Your wallet approves the micropayment via the PayAI facilitator. Settlement is in AUDD on Solana, and the data returns in the same request.

## Settlement currency

Milypay is AUD-stablecoin-agnostic. On Solana it accepts **AUDD**, **AUDM**, and **dAUD** for AUD-native settlement, plus **USDC** and **USDT** for pay.sh compatibility. See https://milypay.xyz/stables for the full reference.

## List your API

Wrap any existing Australian API with the Milypay reference implementation, set a price in AUD, and it becomes discoverable and payable by every agent on Pay.sh. Start at https://milypay.xyz/contact.

## FAQ

**What can an agent do with Milypay?**
Discover Australian data services, get a price in AUD, pay per call, and receive data, all autonomously over x402.

**Do I need an account or API key?**
No. Payment is the authentication. Any x402-aware client can transact.

**How do agents pay?**
With an x402-aware wallet. The first response is an HTTP 402 with the price; the wallet approves it and the request is retried with payment.

**What does it cost?**
Per call, priced in AUD. See the services table. No subscriptions or minimums.

**Which currency is settlement in?**
AUD stablecoins on Solana: AUDD, AUDM, and dAUD. USDC and USDT are also accepted for catalog compatibility.

**Which network?**
Solana, via the PayAI x402 facilitator.

## Links

- Home: https://milypay.xyz
- AUD stablecoins: https://milypay.xyz/stables
- Contact and list an API: https://milypay.xyz/contact
- Catalog: https://pay.sh (namespace `milysec/*`)
- x402 specification: https://x402.org
- Parent company: https://milysec.com


### ASIC company extract (`/au-company-report`)

Official ASIC extract PDF via Business API DSP (directors, officeholders, share capital).

| Host | Behaviour | Price |
|------|-----------|-------|
| `milypay.xyz` | Business API **sandbox** (demo PDF) | free / throttled |
| `api.milypay.xyz` | **Live** extract | **$12** x402 (always paid) |

```bash
# sandbox demo
curl "https://milypay.xyz/api/au-company-report?acn=000014675&type=current"

# live paid
npx milypay --api company-report 000014675
```

Response includes `pdfBase64`, `pdfBytes`, `requestId`, `status`.
MCP tool: `company_report`.

## ABS statistics

Australian Bureau of Statistics via SDMX Data API (no upstream key).

```
GET /au-abs/dataflows?q=CPI
GET /au-abs/dataflow/CPI
GET /au-abs/data/CPI?key=1.10001.10.50.Q&startPeriod=2020
GET /au-abs/cpi
```

CLI: `npx milypay cpi` · `npx milypay abs dataflows wage`
MCP: `abs_cpi`, `abs_dataflows`, `abs_data`
Prices: dataflows/meta $0.002 · data $0.005 · cpi $0.003
Attribution: ABS CC BY 4.0

## Public transport (GTFS-Realtime)

Live GTFS-RT (QLD/SA open; VIC/NSW via configured portal keys):

| Region | Id | Operator | Modes |
|--------|----|----------|-------|
| South East Queensland | `seq` | Translink | — |
| Adelaide | `sa` | Adelaide Metro | — |
| Victoria | `vic` | Transport Victoria | metro tram bus vline |
| New South Wales | `nsw` | TfNSW | buses sydneytrains metro nswtrains ferries lightrail |

```
GET /au-transit/regions
GET /au-transit/seq/vehicles?limit=20
GET /au-transit/vic/summary?mode=tram
GET /au-transit/nsw/vehicles?mode=sydneytrains&limit=10
GET /au-transit/sa/alerts
```

CLI: `npx milypay transit seq vehicles --limit 10` · `npx milypay transit nsw summary --mode buses`
MCP: `transit_vehicles`, `transit_trip_updates`, `transit_alerts`, `transit_summary`, `transit_regions`
Prices: regions $0.001 · summary/alerts $0.002 · vehicles/trips $0.003

## Energy (AEMO NEM)

Live wholesale electricity — no upstream key:

```
GET /au-energy
GET /au-energy/nem
GET /au-energy/nem/NSW1
GET /au-energy/nem/VIC
GET /au-energy/notices?limit=10
```

CLI: `npx milypay nem` · `npx milypay nem vic` · `npx milypay energy notices`
MCP: `energy_nem` · `energy_nem_region` · `energy_notices`
Prices: catalogue $0.001 · nem/notices $0.002

Wholesale spot $/MWh (not retail). Regions: NSW1 QLD1 SA1 TAS1 VIC1.
Source: AEMO ELEC_NEM_SUMMARY.

## Phone line lookup

Line intelligence only (not personal identity / CNAM):

```
GET /au-phone?number=%2B61412345678
GET /au-phone/%2B61412345678
```

AU mobiles accepted as `04xxxxxxxx` (normalized to +61).

Returns: valid, country, national format, line type, carrier name, MCC/MNC.

CLI: `npx milypay phone +61412345678`
MCP: `lookup_phone`
Price: **$0.05** / call

Does **not** return caller name or person identity for anonymous x402 wallets.
