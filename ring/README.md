# @milypay/ring (beta)

Pay Milypay endpoints privately with **Helius Privacy Rings** — *confidential, not anonymous*:
the asset and amount are hidden on-chain; the sender and the recipient (Milypay) are public.

Node >= 22.12. Built on `@heliuslabs/spr` (alpha).

```ts
import { RingWallet, ringFetch } from "@milypay/ring";

const wallet = await RingWallet.create(secretKeyBytes);   // 64-byte Solana secret or 32-byte seed
await wallet.shield("USDC", "0.10");                       // public -> private (once)
const res = await ringFetch("https://api.milypay.xyz/au-company/acn/695484756", {}, { wallet });
```

Defaults to Milypay's sponsored, rate-limited endpoints (`https://api.milypay.xyz/ring/{rpc,indexer,prover}`).

Protocol: the 402 lists `private-exact` entries (rail `helius-rings`, USDC/AUDD). Send a private
transfer of at least `amount` to `extra.shieldedAddress`, sign `milypay-ring:v1:<txSignature>` with the
key that signed it, and retry with `PAYMENT-SIGNATURE: base64({x402Version:2, accepted, payload:{txSignature, payer, signature}})`.
409 + `retryable` → resend in ~2s. A verified payment can be retried for the same URL for 600s.

Docs: https://milypay.xyz/docs/ring · Tests: `node test/localnet-e2e.mjs` (needs a local Rings stack).
