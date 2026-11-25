// milypay-ring: Helius Rings (private payments) verifier + sponsored proof proxy.
//
// Private Worker: no public routes, reached only through the main milypay
// Worker's service binding (env.RING). The main Worker forwards
//   api.milypay.xyz/ring/{prover,indexer,rpc}/...  -> /proxy/...
// and calls /internal/{verify,served,release} from the x402 gate.
//
// Holds only the recipient VIEWING key (RING_VIEWING_KEY). The spending seed
// stays offline on Sal's Mac.

import { initializePoseidon, ShieldedAddress, verifyRingBinding, verifyRingPayment } from "../../ring/src/verify";
import {
  RING_MINTS,
  RING_PRIVACY,
  RING_PROGRAM_ID,
  RING_REGISTRY_PROGRAM_ID,
  RING_RETRY_WINDOW_SECONDS,
} from "../../ring/src/protocol";

interface RateLimiter {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  RING_DB: D1Database;
  PROVE_LIMITER?: RateLimiter;
  READ_LIMITER?: RateLimiter;
  /** Secret: hex ViewingKey.secretBytes(). */
  RING_VIEWING_KEY?: string;
  /** Secret: Helius RPC base (named host carries the key). */
  HELIUS_RPC_URL?: string;
  /** Optional override (localnet testing): privacy indexer base. */
  RING_INDEXER_URL?: string;
  /** Optional comma-separated extra mints (localnet testing only). */
  RING_EXTRA_MINTS?: string;
  RING_SHIELDED_ADDRESS: string;
  RING_PAY_TO: string;
  RING_PROOF_DAILY_CAP?: string;
  RING_PROOF_IP_DAILY_CAP?: string;
  RING_READ_DAILY_CAP?: string;
  RING_READ_IP_DAILY_CAP?: string;
}

const RPC_ALLOW = new Set([
  "getAccountInfo",
  "getMultipleAccounts",
  "getBalance",
  "getLatestBlockhash",
  "getSlot",
  "getBlockHeight",
  "getSignatureStatuses",
  "getTransaction",
  "getTokenAccountBalance",
  "getMinimumBalanceForRentExemption",
  "getProgramAccounts",
  "getHealth",
  "getVersion",
  "getGenesisHash",
  "sendTransaction",
  "simulateTransaction",
]);
const GPA_PROGRAMS = new Set([RING_PROGRAM_ID, RING_REGISTRY_PROGRAM_ID]);
const INDEXER_ALLOW = new Set([
  "getEncryptedUtxosByTags",
  "getShieldedTransactionsByTags",
  "getShieldedTransactionsBySignature",
  "getShieldedTransactionsByNullifiers",
  "getMerkleProofs",
  "getNonInclusionProofs",
  "getNullifierQueueElements",
  "getUserRecords",
]);
// Prover routes under {prover}/: attestation, proving-keys, prove/<key>[/status|/indexed]
const PROVER_ROUTE = /^\/(attestation|proving-keys|prove\/[A-Za-z0-9_.-]{1,96}(\/(status|indexed))?)\/?$/;
const TEE_HEADERS = ["spr-tee", "spr-tee-enc", "spr-tee-ciphertext", "content-type", "accept"];

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });

const nowS = () => Math.floor(Date.now() / 1000);
const today = () => new Date().toISOString().slice(0, 10);

let poseidon: Promise<void> | null = null;
function ensurePoseidon() {
  poseidon ??= initializePoseidon().catch((e) => {
    poseidon = null;
    throw e;
  });
  return poseidon;
}

function heliusBase(env: Env): string {
  const u = (env.HELIUS_RPC_URL || "").trim().replace(/\/+$/, "");
  if (!u) throw new Error("HELIUS_RPC_URL not configured");
  return u;
}

async function bump(env: Env, kind: "proof" | "read", ip: string): Promise<{ all: number; ip: number }> {
  const day = today();
  const stmt = `INSERT INTO ring_proxy_usage (day, key, kind, count) VALUES (?1, ?2, ?3, 1)
     ON CONFLICT(day, key, kind) DO UPDATE SET count = count + 1 RETURNING count`;
  const [a, b] = await env.RING_DB.batch([
    env.RING_DB.prepare(stmt).bind(day, "all", kind),
    env.RING_DB.prepare(stmt).bind(day, ip, kind),
  ]);
  return {
    all: Number((a.results?.[0] as { count?: number })?.count ?? 0),
    ip: Number((b.results?.[0] as { count?: number })?.count ?? 0),
  };
}

function capped(msg: string, retryAfter = 3600) {
  return json({ error: "Too Many Requests", code: "ring_proxy_capped", message: msg, retryAfterSeconds: retryAfter }, 429, {
    "retry-after": String(retryAfter),
  });
}

async function guard(env: Env, kind: "proof" | "read", ip: string): Promise<Response | null> {
  const limiter = kind === "proof" ? env.PROVE_LIMITER : env.READ_LIMITER;
  if (limiter) {
    const { success } = await limiter.limit({ key: `${kind}:${ip}` });
    if (!success) return capped(`Rate limit on Milypay's sponsored ${kind} proxy. Slow down.`, 60);
  }
  const c = await bump(env, kind, ip);
  const capAll = Number(kind === "proof" ? env.RING_PROOF_DAILY_CAP || 300 : env.RING_READ_DAILY_CAP || 50000);
  const capIp = Number(kind === "proof" ? env.RING_PROOF_IP_DAILY_CAP || 30 : env.RING_READ_IP_DAILY_CAP || 3000);
  if (c.ip > capIp) return capped(`Daily ${kind} cap per client reached on Milypay's sponsored proxy. Use your own Helius endpoint.`);
  if (c.all > capAll) return capped(`Milypay's sponsored ${kind} budget for today is used up. Use your own Helius endpoint or retry tomorrow (UTC).`);
  return null;
}

async function proxyRpc(req: Request, env: Env, ip: string): Promise<Response> {
  if (req.method !== "POST") return json({ error: "POST JSON-RPC only" }, 405);
  const body = (await req.json().catch(() => null)) as { method?: string; params?: unknown[] } | unknown[] | null;
  if (!body || Array.isArray(body)) return json({ error: "single JSON-RPC request only (no batches)" }, 400);
  const method = String(body.method || "");
  if (!RPC_ALLOW.has(method)) return json({ jsonrpc: "2.0", id: null, error: { code: -32601, message: `method ${method} not available on the Milypay ring proxy` } }, 400);
  if (method === "getProgramAccounts") {
    const prog = Array.isArray(body.params) ? String(body.params[0] ?? "") : "";
    if (!GPA_PROGRAMS.has(prog)) return json({ jsonrpc: "2.0", id: null, error: { code: -32601, message: "getProgramAccounts only for the Rings programs" } }, 400);
  }
  const blocked = await guard(env, "read", ip);
  if (blocked) return blocked;
  const up = await fetch(heliusBase(env), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return new Response(up.body, { status: up.status, headers: { "content-type": up.headers.get("content-type") || "application/json" } });
}

async function proxyIndexer(req: Request, env: Env, ip: string, method: string): Promise<Response> {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!INDEXER_ALLOW.has(method)) return json({ error: `indexer method ${method} not available` }, 404);
  const blocked = await guard(env, "read", ip);
  if (blocked) return blocked;
  const up = await fetch(`${heliusBase(env)}/v1/spr/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await req.text(),
  });
  return new Response(up.body, { status: up.status, headers: { "content-type": up.headers.get("content-type") || "application/json" } });
}

async function proxyProver(req: Request, env: Env, ip: string, sub: string, search: string): Promise<Response> {
  if (!PROVER_ROUTE.test(sub)) return json({ error: "prover route not available" }, 404);
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const isProof = req.method === "POST" && sub.startsWith("/prove/") && !sub.endsWith("/status");
  const blocked = await guard(env, isProof ? "proof" : "read", ip);
  if (blocked) return blocked;
  const headers = new Headers();
  for (const h of TEE_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  const up = await fetch(`${heliusBase(env)}/v1/spr${sub}${search}`, {
    method: req.method,
    headers,
    body: req.method === "POST" ? await req.arrayBuffer() : undefined,
  });
  const out = new Headers();
  for (const [k, v] of up.headers) {
    const lk = k.toLowerCase();
    if (lk.startsWith("spr-tee") || lk === "content-type" || lk === "retry-after") out.set(k, v);
  }
  return new Response(up.body, { status: up.status, headers: out });
}

interface VerifyBody {
  txSignature: string;
  payer: string;
  signature: string;
  mint: string;
  required: string;
  resource: string;
  method?: string;
}

async function internalVerify(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => null)) as VerifyBody | null;
  if (!b?.txSignature || !b.payer || !b.signature || !b.mint || !b.required || !b.resource) {
    return json({ ok: false, code: "invalid_proof", message: "missing fields", retryable: false }, 400);
  }
  const extra = (env.RING_EXTRA_MINTS || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!Object.values(RING_MINTS).some((m) => m.mint === b.mint) && !extra.includes(b.mint)) {
    return json({ ok: false, code: "unsupported_asset", message: "asset not accepted on the ring rail", retryable: false }, 400);
  }
  if (!env.RING_VIEWING_KEY || !env.RING_SHIELDED_ADDRESS) {
    return json({ ok: false, code: "ring_not_configured", message: "ring rail not configured", retryable: false }, 503);
  }
  // Binding first: txSignature and payer are public on-chain, so only the payer's
  // signature may claim (or retry) a payment.
  const binding = verifyRingBinding(b);
  if (binding) return json(binding, 402);
  const now = nowS();
  const existing = await env.RING_DB.prepare("SELECT * FROM ring_payments WHERE tx_signature = ?1")
    .bind(b.txSignature)
    .first<{ status: string; payer: string; resource: string; claimed_at: number; lease_until: number; amount: string; slot: number }>();
  if (existing) {
    if (existing.status === "served") {
      return json({ ok: false, code: "payment_already_used", message: "this payment already paid for a served request", retryable: false }, 409);
    }
    if (existing.payer !== b.payer || existing.resource !== b.resource) {
      return json({ ok: false, code: "payment_already_used", message: "this payment is bound to another request", retryable: false }, 409);
    }
    if (now - existing.claimed_at > RING_RETRY_WINDOW_SECONDS) {
      return json({ ok: false, code: "retry_window_expired", message: `retry window (${RING_RETRY_WINDOW_SECONDS}s) for this payment has passed`, retryable: false }, 409);
    }
    // Retry inside the window: take a 60s lease so two concurrent retries cannot both be served.
    const lease = await env.RING_DB.prepare(
      "UPDATE ring_payments SET lease_until = ?2, attempts = attempts + 1 WHERE tx_signature = ?1 AND status = 'claimed' AND lease_until < ?3 RETURNING attempts",
    )
      .bind(b.txSignature, now + 60, now)
      .first<{ attempts: number }>();
    if (!lease) return json({ ok: false, code: "payment_in_flight", message: "a request with this payment is already in flight", retryable: true }, 409);
    return json({ ok: true, retry: true, attempts: lease.attempts, amount: existing.amount, slot: existing.slot });
  }

  await ensurePoseidon();
  const base = heliusBase(env);
  const result = await verifyRingPayment({
    rpcUrl: base,
    indexerUrl: env.RING_INDEXER_URL || `${base}/v1/spr`,
    viewingKeyHex: env.RING_VIEWING_KEY,
    shieldedAddressHex: env.RING_SHIELDED_ADDRESS,
    txSignature: b.txSignature,
    payer: b.payer,
    signature: b.signature,
    mint: b.mint,
    minAmount: BigInt(b.required),
  });
  if (!result.ok) return json(result, result.retryable ? 409 : 402);

  const ins = await env.RING_DB.prepare(
    `INSERT INTO ring_payments (tx_signature, payer, mint, amount, required, resource, method, status, slot, block_time, claimed_at, lease_until)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'claimed', ?8, ?9, ?10, ?11)
     ON CONFLICT(tx_signature) DO NOTHING RETURNING tx_signature`,
  )
    .bind(b.txSignature, b.payer, b.mint, result.amount.toString(), b.required, b.resource, b.method || "GET", result.slot, result.blockTime, now, now + 60)
    .first();
  if (!ins) return json({ ok: false, code: "payment_in_flight", message: "a concurrent request claimed this payment", retryable: true }, 409);
  return json({ ok: true, retry: false, attempts: 1, amount: result.amount, slot: result.slot, blockTime: result.blockTime });
}

async function internalMark(req: Request, env: Env, served: boolean): Promise<Response> {
  const b = (await req.json().catch(() => null)) as { txSignature?: string } | null;
  if (!b?.txSignature) return json({ ok: false }, 400);
  const sql = served
    ? "UPDATE ring_payments SET status = 'served', served_at = ?2, lease_until = 0 WHERE tx_signature = ?1 AND status = 'claimed'"
    : "UPDATE ring_payments SET lease_until = 0 WHERE tx_signature = ?1 AND status = 'claimed'";
  const stmt = env.RING_DB.prepare(sql);
  const r = await (served ? stmt.bind(b.txSignature, nowS()) : stmt.bind(b.txSignature)).run();
  return json({ ok: true, changed: r.meta.changes });
}

async function status(env: Env): Promise<Response> {
  let usage: unknown = null;
  let payments: unknown = null;
  try {
    usage = (await env.RING_DB.prepare("SELECT kind, count FROM ring_proxy_usage WHERE day = ?1 AND key = 'all'").bind(today()).all()).results;
    payments = await env.RING_DB.prepare(
      "SELECT COUNT(*) AS total, SUM(status = 'served') AS served FROM ring_payments WHERE claimed_at > ?1",
    )
      .bind(nowS() - 86400)
      .first();
  } catch {
    /* table missing */
  }
  return json({
    rail: "helius-rings",
    label: "beta",
    privacy: RING_PRIVACY,
    configured: Boolean(env.RING_VIEWING_KEY && env.RING_SHIELDED_ADDRESS && env.HELIUS_RPC_URL),
    payTo: env.RING_PAY_TO,
    assets: Object.keys(RING_MINTS),
    caps: {
      proofsPerDay: Number(env.RING_PROOF_DAILY_CAP || 300),
      proofsPerClientPerDay: Number(env.RING_PROOF_IP_DAILY_CAP || 30),
      readsPerDay: Number(env.RING_READ_DAILY_CAP || 50000),
      readsPerClientPerDay: Number(env.RING_READ_IP_DAILY_CAP || 3000),
    },
    usageToday: usage,
    payments24h: payments,
  });
}

async function selftest(env: Env): Promise<Response> {
  const t = Date.now();
  await ensurePoseidon();
  const addr = ShieldedAddress.fromBytes(Uint8Array.from((env.RING_SHIELDED_ADDRESS.match(/../g) || []).map((h) => parseInt(h, 16))));
  return json({ ok: true, poseidonMs: Date.now() - t, solanaAddress: addr.solanaAddress(), matchesPayTo: addr.solanaAddress() === env.RING_PAY_TO });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const ip = req.headers.get("x-milypay-client-ip") || req.headers.get("cf-connecting-ip") || "unknown";
    try {
      if (path === "/status") return await status(env);
      if (path === "/selftest") return await selftest(env);
      if (path === "/internal/verify" && req.method === "POST") return await internalVerify(req, env);
      if (path === "/internal/served" && req.method === "POST") return await internalMark(req, env, true);
      if (path === "/internal/release" && req.method === "POST") return await internalMark(req, env, false);
      if (path === "/proxy/rpc" || path === "/proxy/rpc/") return await proxyRpc(req, env, ip);
      if (path.startsWith("/proxy/indexer/")) return await proxyIndexer(req, env, ip, path.slice("/proxy/indexer/".length).replace(/\/+$/, ""));
      if (path.startsWith("/proxy/prover/")) return await proxyProver(req, env, ip, path.slice("/proxy/prover".length), url.search);
      return json({ error: "Not Found", code: "not_found" }, 404);
    } catch (e) {
      console.error("ring worker error", e instanceof Error ? e.message : String(e));
      return json({ ok: false, code: "ring_internal_error", message: "ring service error", retryable: true }, 503);
    }
  },
};
