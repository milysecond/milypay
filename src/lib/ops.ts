import { payaiAuthConfigured } from "./payai-auth";

const RPC =
  process.env.SOLANA_RPC_URL ||
  process.env.HELIUS_RPC_URL ||
  "https://viviyan-bkj12u-fast-mainnet.helius-rpc.com";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const AUDD = "AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw";
const AUDM = "CiYXBwHPrdNkMtxR8YEWKv78K6bQjFoEWhPQrZqEmubi";
const DAUD = "F7FiKutfrMMXd8Zw5ysZsfx5v4aBHffWc4EhRZE8NHiF";
const FLOAT_PAYER = "CJnsfwWEif4G1mWsJWkjoWSuRpoPoCQHWsQdgzEFDufC";

const MINTS: Record<string, { symbol: string; decimals: number }> = {
  [USDC]: { symbol: "USDC", decimals: 6 },
  [USDT]: { symbol: "USDT", decimals: 6 },
  [AUDD]: { symbol: "AUDD", decimals: 6 },
  [AUDM]: { symbol: "AUDM", decimals: 6 },
  [DAUD]: { symbol: "dAUD", decimals: 9 },
};

function soft<T>(p: Promise<T>, fallback: T, ms = 8_000): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function rpc<T = unknown>(method: string, params: unknown[]): Promise<T | null> {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { result?: T; error?: unknown };
    if (d.error) return null;
    return d.result ?? null;
  } catch {
    return null;
  }
}

async function solBalance(addr: string): Promise<number | null> {
  const r = await rpc<{ value: number }>("getBalance", [addr]);
  return r ? r.value / 1e9 : null;
}

async function tokenBalances(owner: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all(
    Object.entries(MINTS).map(async ([mint, meta]) => {
      const r = await rpc<{
        value: {
          account: {
            data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } };
          };
        }[];
      }>("getTokenAccountsByOwner", [owner, { mint }, { encoding: "jsonParsed" }]);
      const sum = (r?.value || []).reduce(
        (s, a) => s + (a.account.data.parsed.info.tokenAmount.uiAmount || 0),
        0,
      );
      out[meta.symbol] = sum;
    }),
  );
  return out;
}

export type OpsTx = {
  signature: string;
  slot?: number;
  blockTime?: number | null;
  err?: unknown;
  receiptUrl: string;
};

async function recentSigs(addr: string, limit = 15): Promise<OpsTx[]> {
  const r = await rpc<
    { signature: string; slot: number; blockTime: number | null; err: unknown | null }[]
  >("getSignaturesForAddress", [addr, { limit }]);
  return (r || []).map((s) => ({
    signature: s.signature,
    slot: s.slot,
    blockTime: s.blockTime,
    err: s.err,
    receiptUrl: `https://sol.new/receipt/${s.signature}`,
  }));
}

export type OpsProbe = {
  id: string;
  ok: boolean;
  status?: number;
  ms?: number;
  error?: string;
};

async function probe(path: string, id: string): Promise<OpsProbe> {
  const base = "https://milypay.xyz/api";
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { accept: "application/json", "user-agent": "milypay-ops/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    return {
      id,
      ok: res.status === 200 || res.status === 402,
      status: res.status,
      ms: Date.now() - t0,
    };
  } catch (e) {
    return {
      id,
      ok: false,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : "fail",
    };
  }
}

export async function collectOpsData() {
  const payTo = process.env.PAY_TO_WALLET || "mi1ytDfgNFYgm54y4f3xzRQbfbyCz6TBmQcAL3brozA";
  const checkedAt = new Date().toISOString();

  const [
    payToSol,
    payToTokens,
    floatSol,
    floatTokens,
    recent,
    probes,
  ] = await Promise.all([
    soft(solBalance(payTo), null),
    soft(tokenBalances(payTo), {}),
    soft(solBalance(FLOAT_PAYER), null),
    soft(tokenBalances(FLOAT_PAYER), {}),
    soft(recentSigs(payTo, 20), []),
    Promise.all([
      probe("/au-business/abn/51824753556", "abn"),
      probe("/au-company/acn/000014675", "company"),
      probe("/au-bsb/012-002", "bsb"),
      probe("/au-address/geocode?q=1%20bligh%20st%20sydney", "address"),
      probe("/au-weather?q=sydney", "weather"),
      probe("/au-abs/cpi", "abs-cpi"),
      probe("/au-transit/seq/summary", "transit-seq"),
      probe("/au-energy/nem", "energy-nem"),
      // phone needs a number — skip live probe or use query form 400 as up
      probe("/au-phone", "phone-route"),
    ]),
  ]);

  // paid API sample
  let paidApi: OpsProbe;
  {
    const t0 = Date.now();
    try {
      const res = await fetch("https://api.milypay.xyz/au-business/abn/51824753556", {
        signal: AbortSignal.timeout(10_000),
      });
      paidApi = {
        id: "api-402",
        ok: res.status === 402,
        status: res.status,
        ms: Date.now() - t0,
      };
    } catch (e) {
      paidApi = {
        id: "api-402",
        ok: false,
        ms: Date.now() - t0,
        error: e instanceof Error ? e.message : "fail",
      };
    }
  }

  return {
    checkedAt,
    brand: "Milypay" as const,
    x402Enabled: process.env.X402_ENABLED === "true",
    payaiAuth: payaiAuthConfigured(),
    payTo,
    floatPayer: FLOAT_PAYER,
    balances: {
      merchant: { sol: payToSol, tokens: payToTokens },
      float: { sol: floatSol, tokens: floatTokens },
    },
    recentTxs: recent,
    probes: [...probes, paidApi],
    links: {
      status: "https://milypay.xyz/status",
      merchantPayai: "https://merchant.payai.network",
      payToSolscan: `https://solscan.io/account/${payTo}`,
      agents: "https://milypay.xyz/agents.md",
    },
  };
}
