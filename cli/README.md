# milypay CLI

Terminal client for [Milypay](https://milypay.xyz) — Australian data over [x402](https://x402.org).

```bash
# free demo host (rate-limited, no wallet)
npx milypay abn 51824753556

# paid API (AUDD/USDC/… on Solana)
export MILYPAY_PRIVATE_KEY=<base58-secret>
npx milypay --api abn 51824753556
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
| `milypay postage --from --to --weight` | AusPost rates |
| `milypay call /path` | Raw path |
| `milypay whoami` | Configured wallet |

## Flags

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
