/**
 * Optional Helius Privacy Rings rail (beta) — "confidential, not anonymous".
 * Needs Node >= 22.12 and the optional `@milypay/ring` package:
 *   npm i -g @milypay/ring   (or alongside milypay in your project)
 * Loaded dynamically so the base CLI keeps working on Node 18 without it.
 */
import { loadSecretBytes, walletHelp } from "./wallet.js";

export const RING_PKG = "@milypay/ring";

type Balance = { symbol: string; mint: string; atomic: bigint; amount: string };
type TxResult = { signature: string; slot?: unknown; simulated?: boolean; [k: string]: unknown };
export interface RingWalletLike {
  address: string;
  shieldedAddressHex: string;
  sync(): Promise<void>;
  balance(asset: string): Promise<Balance>;
  balances(): Promise<Balance[]>;
  publicSol(): Promise<bigint>;
  shield(asset: string, human: string, opts?: { simulateOnly?: boolean }): Promise<TxResult>;
  unshield(asset: string, human: string, to?: string): Promise<TxResult>;
  destroy?(): void;
}
interface RingModule {
  RingWallet: { create(secret: Uint8Array, endpoints?: Record<string, string>): Promise<RingWalletLike> };
  ringFetch(
    url: string,
    init: RequestInit,
    opts: { wallet: RingWalletLike; asset?: string; maxAtomic?: bigint; log?: (m: string) => void },
  ): Promise<Response>;
  RING_PRIVACY: string;
  MILYPAY_RING_ENDPOINTS: Record<string, string>;
}

let cached: RingModule | null = null;

export async function loadRing(): Promise<RingModule> {
  if (cached) return cached;
  const [maj, min] = process.versions.node.split(".").map(Number);
  if (maj < 22 || (maj === 22 && min < 12)) {
    throw new Error(`The ring rail needs Node >= 22.12 (you have ${process.versions.node}).`);
  }
  const name = RING_PKG;
  try {
    cached = (await import(name)) as RingModule;
    return cached;
  } catch (e) {
    throw new Error(
      `The ring rail needs the optional package ${RING_PKG} (beta). Install it next to milypay, then retry.\n` +
        `(${(e as Error).message.split("\n")[0]})`,
    );
  }
}

function endpointsFromEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  if (process.env.MILYPAY_RING_RPC) out.rpcUrl = process.env.MILYPAY_RING_RPC;
  if (process.env.MILYPAY_RING_INDEXER) out.indexerUrl = process.env.MILYPAY_RING_INDEXER;
  if (process.env.MILYPAY_RING_PROVER) out.proverUrl = process.env.MILYPAY_RING_PROVER;
  if (process.env.MILYPAY_RING_NETWORK) out.network = process.env.MILYPAY_RING_NETWORK;
  return out;
}

export async function openRingWallet(): Promise<{ mod: RingModule; wallet: RingWalletLike }> {
  const mod = await loadRing();
  const secret = loadSecretBytes();
  if (!secret) throw new Error(walletHelp());
  const wallet = await mod.RingWallet.create(secret, endpointsFromEnv());
  return { mod, wallet };
}

const jsonable = (v: unknown): unknown =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x)));

export async function ringStatus() {
  const { mod, wallet } = await openRingWallet();
  try {
    return jsonable({
      rail: "helius-rings",
      label: "beta",
      privacy: mod.RING_PRIVACY,
      address: wallet.address,
      shieldedAddress: wallet.shieldedAddressHex,
      endpoints: { ...mod.MILYPAY_RING_ENDPOINTS, ...endpointsFromEnv() },
    });
  } finally {
    wallet.destroy?.();
  }
}

export async function ringBalance(asset?: string) {
  const { wallet } = await openRingWallet();
  try {
    await wallet.sync();
    const sol = await wallet.publicSol();
    const priv = asset ? [await wallet.balance(asset)] : await wallet.balances();
    return jsonable({ address: wallet.address, publicSolLamports: sol, private: priv });
  } finally {
    wallet.destroy?.();
  }
}

export async function ringShield(amount: string, asset: string, simulateOnly = false) {
  const { wallet } = await openRingWallet();
  try {
    const r = await wallet.shield(asset, amount, { simulateOnly });
    const { amount: atomic, ...rest } = r as TxResult & { amount?: unknown };
    return jsonable({ action: simulateOnly ? "shield (simulated, nothing sent)" : "shield", asset, amount, atomic, ...rest });
  } finally {
    wallet.destroy?.();
  }
}

export async function ringUnshield(amount: string, asset: string, to?: string) {
  const { wallet } = await openRingWallet();
  try {
    await wallet.sync();
    const r = await wallet.unshield(asset, amount, to);
    const { amount: atomic, ...rest } = r as TxResult & { amount?: unknown };
    return jsonable({ action: "unshield", asset, amount, atomic, to: to ?? wallet.address, ...rest });
  } finally {
    wallet.destroy?.();
  }
}

/** Fetch a paid URL, paying with a private ring transfer. */
export async function ringPaidFetch(
  url: string,
  init: RequestInit,
  opts: { asset?: string; maxAtomic?: bigint; quiet?: boolean } = {},
): Promise<Response> {
  const { mod, wallet } = await openRingWallet();
  try {
    return await mod.ringFetch(url, init, {
      wallet,
      asset: opts.asset,
      maxAtomic: opts.maxAtomic,
      log: (m) => {
        if (!opts.quiet) process.stderr.write(`[ring] ${m}\n`);
      },
    });
  } finally {
    wallet.destroy?.();
  }
}
