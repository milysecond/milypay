# milypay-ring (private Worker)

Verifier + sponsored proxy for the Helius Rings payment rail (beta). No public routes; the main
`milypay` Worker reaches it through the `RING` service binding.

- `POST /internal/verify|served|release` — payment verification (viewing-key decrypt) with D1 replay
  protection (`ring_payments`) and a 600s retry window with 60s leases.
- `/proxy/rpc`, `/proxy/indexer/<method>`, `/proxy/prover/*` — allow-listed, rate-limited, daily-capped
  Helius access for payers (exposed as `api.milypay.xyz/ring/*`).
- `/status`, `/selftest`.

Secrets: `RING_VIEWING_KEY` (hex, watch-only), `HELIUS_RPC_URL`. The spending seed for the merchant
identity is kept offline (not in this repo, not in Cloudflare).

```sh
npx wrangler d1 execute milypay-ring --remote --file schema.sql   # once
npx wrangler deploy
```

Local test: `npx wrangler dev` with `.dev.vars` (see `../ring/test/make-localnet-fixture.mjs`).
Poseidon WASM is precompiled via `src/hasher-shim.ts` (Workers cannot compile WASM from bytes).
