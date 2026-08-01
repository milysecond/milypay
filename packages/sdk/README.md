# @milypay/sdk

TypeScript client for [Milypay](https://milypay.xyz) — Australian data over x402.

```bash
npm i @milypay/sdk
```

```ts
import { Milypay } from "@milypay/sdk";

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
- `call(path)` raw GET

A Milysec company.
