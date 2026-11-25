# milypay CLI

Terminal client for [Milypay](https://milypay.xyz) — Australian data over [x402](https://x402.org).

```bash
# free demo host (rate-limited, no wallet)
npx milypay abn 55695484756

# paid API (AUDD/USDC/… on Solana)
export MILYPAY_PRIVATE_KEY=<base58-secret>
npx milypay --api abn 55695484756
```

## Install

```bash
npm i -g milypay
# or one-shot
npx milypay <command>
```

## Commands

| Command | What |
|---------|------|
| `milypay services` | List endpoints + AUD prices |
| `milypay abn <abn>` | ABR business by ABN |
| `milypay acn <acn>` | ABR business by ACN |
| `milypay business search <name>` | ABN name search |
| `milypay company <acn\|name>` | ASIC open-data company |
| `milypay company-report <acn>` | Official ASIC extract |
| `milypay address validate\|search\|geocode <q>` | G-NAF |
| `milypay super <abn>` | Super fund (ATO) |
| `milypay weather <address>` | BOM forecast |
| `milypay bsb <bsb>` | BSB lookup |
| `milypay bsb search <q>` | BSB search |
| `milypay postage --from 3000 --to 2000 --weight 1` | AusPost rates |
| `milypay abs dataflows\|dataflow\|data …` | ABS (`abs data CPI --key 1.10001.10.50.Q --start 2024`) |
| `milypay cpi [start]` | Headline CPI |
| `milypay transit <region> vehicles\|trips\|alerts\|summary [--limit n]` | GTFS-RT |
| `milypay nem [region]` · `milypay energy notices\|catalogue` | AEMO NEM |
| `milypay phone <number>` | Phone line intel |
| `milypay check <postcode\|reverse\|suburb\|activity\|company-name\|business-name\|sanctions\|director-id\|tfn\|email> <value>` | Checkify extras |
| `milypay asic search <name>` | ASIC extract search (Acceleon, UAT test mode) |
| `milypay asic company\|business <nni>` | Details + purchasable flags |
| `milypay asic purchase <nni> [--type current\|historical]` | Buy extract (paid, POST) |
| `milypay asic status\|extract <id> --token <t> [--out f.pdf]` | Status / download |
| `milypay status` · `milypay stats` | Health / usage |
| `milypay fund status\|session` | MoneyGram pre-fund (sandbox) |
| `milypay domains check\|quote <name>` | DNS check/quote |
| `milypay rides quote -33.87 151.21 -33.90 151.20` | Uber estimates (no booking) |
| `milypay call /path` | Raw path |
| `milypay whoami` | Configured wallet |

## MCP

Stdio only: `npx -y milypay mcp` (set `MILYPAY_HOST=demo`, or `api` + `MILYPAY_PRIVATE_KEY`).

## Flags

Subcommand flags (`--from`, `--limit`, `--token` …) and negative numbers (`-33.87`) pass through to the command.


- `--demo` — force `https://milypay.xyz` (free)
- `--api` — force `https://api.milypay.xyz` (needs wallet)
- `--base <url>` — custom base
- `--rpc <url>` — Solana RPC for payments
- `--quiet` — hide progress on stderr
- `--json` — pretty JSON (default for data cmds)

## Wallet env

Any one of:

- `MILYPAY_PRIVATE_KEY`
- `MILYPAY_SECRET`
- `SOLANA_PAYER_SECRET`
- `SOLANA_PRIVATE_KEY`

Value: base58 secret key **or** JSON byte array.

Optional: `SOLANA_RPC_URL` / `HELIUS_RPC_URL`.

## Defaults

| Wallet | Host |
|--------|------|
| set | `https://api.milypay.xyz` (x402 pay-per-call) |
| unset | `https://milypay.xyz` (free demo, throttled) |

## Docs

- Agents: https://milypay.xyz/agents.md
- Full ref: https://milypay.xyz/llms-full.txt
- Manifest: https://milypay.xyz/.well-known/x402

A [Milysec](https://milysec.com) company.

## MCP server

```bash
npx milypay mcp
```

Claude Desktop / Cursor (`mcp.json`):

```json
{
  "mcpServers": {
    "milypay": {
      "command": "npx",
      "args": ["-y", "milypay", "mcp"],
      "env": {
        "MILYPAY_HOST": "demo"
      }
    }
  }
}
```

| Env | Meaning |
|-----|---------|
| `MILYPAY_HOST=demo` | Free host (default when no wallet) |
| `MILYPAY_HOST=api` | Paid `api.milypay.xyz` |
| `MILYPAY_PRIVATE_KEY` | Solana secret for x402 payments |

**Tools:** `list_services`, `lookup_abn`, `lookup_acn`, `search_business`, `lookup_company`, `search_company`, `company_report`, `address_validate`, `address_search`, `address_geocode`, `lookup_super`, `weather`, `lookup_bsb`, `search_bsb`, `postage`, `call`, `whoami`
