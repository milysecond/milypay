# Helius Rings private rail (beta) — MIL-7 notes

Status: live on mainnet, beta. Labelled "confidential, not anonymous" (sender and recipient public; asset and amount hidden).

## Architecture
- 402 `accepts[]` adds `private-exact` entries (rail `helius-rings`, USDC + AUDD) after the `exact` entries.
- `src/lib/x402.ts` `ringGate`: verify -> handler -> mark served (or release on failure).
- Private Worker `milypay-ring` (service binding `RING`): viewing-key (watch-only) decrypt, payer ed25519 binding
  over `milypay-ring:v1:<txSignature>`, D1 table `ring_payments` (replay + 600s retry window + 60s leases),
  sponsored allow-listed proxy at `api.milypay.xyz/ring/{rpc,indexer,prover}` with rate limits and daily caps.
- Replay store is Cloudflare D1 (`milypay-ring`), not Turso (all Turso tokens were read-only).
- Merchant identity `9gfoX7ojkdXZ5gp7iDGPtHQHvot82eGvQisPBArpG5ni`; spending seed offline on the Mac
  (`~/.milypay/ring/merchant-spending.json`, chmod 600); only `RING_VIEWING_KEY` is a Worker secret.

## First mainnet test — 2026-11-25 (PASS)
Payer `8o6dCtRwE8xWThNXpHFaLn8C29vVvGMNjFUs4eEw8hou` (Sal's default Solana wallet, funded 0.01 SOL + 0.1 USDC).
1. `milypay ring shield 0.10 --asset USDC` — PASS, sig `5dgvxjTAjQG8a9ZwEuW2XuvpG1FSq6a9fCMq3gEnV9B23eT7w6iRDN6362dmR8i4Rzs96FgMKxdykdFckwPLPLgi` (slot 473676776, fee 5000 lamports, no rent).
2. `milypay company 695484756 --rail ring` — PASS (Milysec Pty Ltd returned), private transfer sig
   `22WGWdEQcoq9mHL65ARBNf4UyoY4x3VaXiyJSEGTmX8f78WLWgVjmD5Kdk2WHzuHhPuskZYsmVcJ9G3A6pekBH68` (slot 473676938), 2000 atomic USDC.
3. D1 `ring_payments` row: status `served`, attempts 1, amount 2000/required 2000. Replaying the same payment header
   (same URL and a different URL) -> `402 payment_already_used`.
- After: payer public 0.009985 SOL / 0 USDC; payer shielded 0.098 USDC; merchant shielded 0.002 USDC.
- No code changes were needed.

## Open items
- AUDD interface does not exist until the first AUDD deposit (needs approval + AUDD funds). AUDD ring payments fail until then.
- Merchant shielded balance can be unshielded to the treasury wallet with the offline seed (not automated).
- `@milypay/ring` and CLI 0.2.6 are built, not published (npm token expired).
