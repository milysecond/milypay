// fetch() that pays Milypay's `private-exact` (Helius Rings) 402 challenge.

import type { RingWallet } from "./payer.js";
import {
  RING_SCHEME,
  type RingPaymentPayload,
  type RingRequirement,
  type RingSymbol,
} from "./protocol.js";

export interface RingFetchOptions {
  wallet: RingWallet;
  /** Preferred asset when several are offered. Default: first with enough private balance. */
  asset?: RingSymbol;
  /** Refuse to pay more than this many atomic units. */
  maxAtomic?: bigint;
  /** Retry attempts while the indexer catches up (default 6, 2s apart). */
  retries?: number;
  log?: (msg: string) => void;
}

function decodeChallenge(res: Response): { accepts?: unknown[] } | null {
  const raw = res.headers.get("PAYMENT-REQUIRED") || res.headers.get("payment-required");
  if (!raw) return null;
  try {
    const bin = atob(raw);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function encodeHeader(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function ringRequirements(challenge: { accepts?: unknown[] } | null): RingRequirement[] {
  return ((challenge?.accepts ?? []) as RingRequirement[]).filter((a) => a && a.scheme === RING_SCHEME);
}

export function ringPaymentHeader(accepted: RingRequirement, proof: { txSignature: string; payer: string; signature: string }): string {
  const payload: RingPaymentPayload = {
    x402Version: 2,
    accepted,
    payload: { txSignature: proof.txSignature, payer: proof.payer, signature: proof.signature },
  };
  return encodeHeader(payload);
}

export async function ringFetch(
  input: string,
  init: RequestInit = {},
  opts: RingFetchOptions,
): Promise<Response & { ringReceipt?: { txSignature: string; asset: string; amount: string } }> {
  const log = opts.log ?? (() => {});
  const first = await fetch(input, init);
  if (first.status !== 402) return first;
  const reqs = ringRequirements(decodeChallenge(first));
  if (reqs.length === 0) throw new Error("This endpoint did not offer a private-exact (Helius Rings) payment option");

  let chosen: RingRequirement | undefined;
  const ordered = opts.asset ? [...reqs].sort((a) => (a.extra?.symbol === opts.asset ? -1 : 1)) : reqs;
  for (const r of ordered) {
    const bal = await opts.wallet.balance(r.asset);
    if (bal.atomic >= BigInt(r.amount)) {
      chosen = r;
      break;
    }
  }
  if (!chosen) {
    const want = reqs.map((r) => `${r.amount} atomic ${r.extra?.symbol ?? r.asset}`).join(" or ");
    throw new Error(`Private balance too low: need ${want}. Run \`milypay ring shield <amount> --asset USDC\` first.`);
  }
  if (opts.maxAtomic !== undefined && BigInt(chosen.amount) > opts.maxAtomic) {
    throw new Error(`Price ${chosen.amount} exceeds max ${opts.maxAtomic}`);
  }
  log(`paying ${chosen.amount} atomic ${chosen.extra.symbol} privately (Helius Rings, ${chosen.extra.privacy})`);
  const proof = await opts.wallet.payRequirement(chosen);
  log(`private transfer ${proof.txSignature} confirmed at slot ${proof.slot}`);

  const header = ringPaymentHeader(chosen, proof);
  const headers = new Headers(init.headers);
  headers.set("PAYMENT-SIGNATURE", header);
  const attempts = opts.retries ?? 6;
  let res: Response = first;
  for (let i = 0; i <= attempts; i++) {
    res = await fetch(input, { ...init, headers });
    if (res.status !== 402 && res.status !== 409 && res.status !== 503) break;
    // 409 ring_pending = indexer catching up; retry the SAME proof inside the retry window.
    const body = await res.clone().json().catch(() => null) as { code?: string; details?: { retryable?: boolean } } | null;
    const retryable = res.status === 409 || body?.details?.retryable === true;
    if (!retryable || i === attempts) break;
    log(`server not ready (${body?.code ?? res.status}); retrying in 2s`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  return Object.assign(res, { ringReceipt: { txSignature: proof.txSignature, asset: chosen.asset, amount: chosen.amount } });
}
