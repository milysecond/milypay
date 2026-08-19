# milypay-sdk

> Also planned as `@milypay/sdk` once the npm org exists.

TypeScript client for [Milypay](https://milypay.xyz) — Australian data over x402.

```bash
npm i milypay-sdk
```

```ts
import { Milypay } from "milypay-sdk";

// Free demo host (rate-limited)
const demo = new Milypay({ host: "demo" });
const biz = await demo.business.abn("51824753556");

// Paid API with Solana wallet (base58 secret)
const paid = new Milypay({
  host: "api",
  privateKey: process.env.MILYPAY_PRIVATE_KEY!,
});
const company = await paid.company.acn("000014675");
// company.$receipt? — settlement metadata when paid

// MoneyGram pre-fund (does NOT settle x402)
const status = await paid.ramp.moneygram();
const session = await paid.ramp.session("on-ramp");
// open session.widgetUrl → USDC in wallet → retry paid calls
```

## Hosts

| host | base | payment |
|------|------|---------|
| `demo` | https://milypay.xyz/api | free, throttled |
| `api` | https://api.milypay.xyz | x402 required |
| `auto` | api if key else demo | |

## API surface

- `business.abn / acn / search`
- `company.acn / search / report`
- `address.validate / search / geocode`
- `super.abn`
- `weather({ q } | { lat, lng })`
- `bsb.lookup / search`
- `postage({ from, to, weight, ... })`
- `phone.lookup`
- `energy.catalogue / nem / nemRegion / notices`
- `transit.regions / vehicles / tripUpdates / alerts / summary`
- `abs.dataflows / dataflow / data / cpi`
- `domains.check / quote`
- `rides.quote / eta / products` (Uber estimates only)
- `ramp.moneygram()` · `ramp.session('on-ramp'|'off-ramp')`
- `get(path)` · `post(path, body)` · `call(path)`

## Funding + x402

MoneyGram tops up USDC. x402 still pays the API:

1. Paid call → 402 (`body.funding.moneygram`)
2. `ramp.session('on-ramp')` → open `widgetUrl`
3. Retry with wallet key / x402 client

Demo UI: https://milypay.xyz/fund

A Milysec company.
