# Tempo support on Milypay

## What Tempo is

[Tempo](https://tempo.xyz) is a payments-first L1 (Stripe + Paradigm).

| | |
|--|--|
| Mainnet | chainId **4217** · CAIP-2 `eip155:4217` |
| RPC | `https://rpc.tempo.xyz` |
| Explorer | https://explore.tempo.xyz |
| Testnet | Moderato **42431** |
| Stables | TIP-20 (pathUSD, USDC.e, USDT0, …) |

## Two different payment protocols

| Protocol | Status on Tempo | Milypay path |
|----------|-----------------|--------------|
| **MPP** (Machine Payments Protocol) | **Native** — `mppx` middleware | Preferred for Tempo agents |
| **x402** (Coinbase / PayAI) | Protocol can target any `eip155:*` | Scaffold ready; **blocked on facilitator** |

PayAI `/supported` (checked 2026-08) lists Solana + many EVM chains — **not** `eip155:4217`.

## What we shipped (scaffold)

### Multi-network x402 (`src/lib/x402.ts`)

402 `accepts[]` can include Solana **and** Tempo when:

```bash
TEMPO_X402=true
TEMPO_PAY_TO=0xYourTempoReceiveAddress
# optional:
TEMPO_NETWORK=eip155:4217
TEMPO_PATHUSD=0x20c0000000000000000000000000000000000000
TEMPO_USDC=0x20c000000000000000000000b9537d11c60e8b50
```

Until PayAI (or another facilitator) settles Tempo txs, clients that pick a Tempo accept will fail at `/verify`. Keep the flag **off** in production until E2E works.

Constants: `src/lib/tempo.ts`.

### Receipts

- Solana → `https://sol.new/receipt/<sig>`
- Tempo (`eip155:*`) → `https://explore.tempo.xyz/tx/<hash>`

## Live MPP (shipped)

Env on Worker:

- `TEMPO_MPP=true`
- `TEMPO_PAY_TO=0x…` (merchant receive)
- `MPP_SECRET_KEY` (32+ bytes HMAC)
- `MPP_REALM=api.milypay.xyz`

Client:

```
curl -H "X-Payment-Rail: mpp" https://api.milypay.xyz/au-energy/nem
# → 402 + WWW-Authenticate: Payment …
# Retry with Authorization: Payment <credential>
```

Or `?rail=mpp`. Solana x402 unchanged (PAYMENT-SIGNATURE).

## What we still need for live Tempo

### A. x402-on-Tempo (when facilitator ready)

1. Facilitator lists `eip155:4217` (ask PayAI or run your own)
2. Set `TEMPO_PAY_TO` + `TEMPO_X402=true` on Worker
3. E2E: 402 → pay pathUSD/USDC.e → 200 on one route
4. CLI/SDK: EVM signing path (not Solana key only)

### B. MPP (works today — separate gate)

Tempo’s agent story is **MPP**, not x402:

```ts
import { Mppx, tempo } from 'mppx/nextjs'

const mppx = Mppx.create({
  realm: 'api.milypay.xyz',
  methods: [tempo({
    currency: '0x20c0000000000000000000000000000000000000', // pathUSD
    recipient: process.env.TEMPO_PAY_TO!,
  })],
})

// per route: mppx.charge({ amount: '0.002' })(handler)
```

Checklist:

1. Generate Tempo receive wallet → `TEMPO_PAY_TO`
2. `pnpm add mppx viem` (or use CF-compatible subset)
3. Add `withMpp` gate **or** dual-accept on paid host
4. Confirm Worker bundle size / Edge runtime
5. List on [mpp.dev](https://mpp.dev) directory
6. Docs: agents can pay Solana-x402 **or** Tempo-MPP

## Decision

| Goal | Do this |
|------|---------|
| Keep Solana agents only | Leave `TEMPO_X402` unset |
| Advertise Tempo in x402 early | Wait for facilitator, then flip flag |
| Serve Tempo-native agents now | Implement **MPP** (`mppx`) |

## Links

- https://tempo.xyz/developers/docs/guide/machine-payments/server
- https://tokenlist.tempo.xyz/list/4217
- https://docs.payai.network/x402
- https://docs.x402.org/core-concepts/network-and-token-support
