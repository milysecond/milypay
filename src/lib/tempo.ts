/**
 * Tempo (Stripe/Paradigm payments L1) constants for Milypay.
 *
 * Chain: mainnet Presto chainId 4217 → CAIP-2 eip155:4217
 * Testnet Moderato: 42431
 *
 * Agent payments on Tempo today = MPP (Machine Payments Protocol / mppx),
 * not Coinbase x402. PayAI facilitator does not list eip155:4217 yet.
 *
 * @see https://tempo.xyz/developers/docs/quickstart/connection-details
 * @see https://tempo.xyz/developers/docs/guide/machine-payments/server
 * @see docs/TEMPO.md
 */

/** Tempo Mainnet (Presto) */
export const TEMPO_CHAIN_ID = 4217;
export const TEMPO_MAINNET_CAIP2 = `eip155:${TEMPO_CHAIN_ID}`;
export const TEMPO_RPC = "https://rpc.tempo.xyz";
export const TEMPO_EXPLORER = "https://explore.tempo.xyz";

/** Tempo Testnet (Moderato) */
export const TEMPO_TESTNET_CHAIN_ID = 42431;
export const TEMPO_TESTNET_CAIP2 = `eip155:${TEMPO_TESTNET_CHAIN_ID}`;
export const TEMPO_TESTNET_RPC = "https://rpc.moderato.tempo.xyz";

/** pathUSD — primary TIP-20 stable on Tempo (docs / mppx examples) */
export const TEMPO_PATHUSD = "0x20c0000000000000000000000000000000000000";

/** Bridged USDC (Stargate) on Tempo mainnet — tokenlist.tempo.xyz/list/4217 */
export const TEMPO_USDC_E = "0x20c000000000000000000000b9537d11c60e8b50";

/** USDT0 on Tempo mainnet */
export const TEMPO_USDT0 = "0x20c00000000000000000000014f22ca97301eb73";

export function tempoEnabled(): boolean {
  return process.env.TEMPO_X402 === "true" && Boolean(tempoPayTo());
}

export function tempoPayTo(): string | null {
  const a = process.env.TEMPO_PAY_TO?.trim();
  if (!a || !/^0x[a-fA-F0-9]{40}$/.test(a)) return null;
  return a;
}

export function tempoNetwork(): string {
  return process.env.TEMPO_NETWORK?.trim() || TEMPO_MAINNET_CAIP2;
}

export function tempoExplorerTx(txHash: string): string {
  return `${TEMPO_EXPLORER}/tx/${txHash}`;
}
