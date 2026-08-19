import { createX402Client } from "x402-solana/client";
import { API_BASE, DEMO_BASE } from "./services.js";
import { loadWallet, type Wallet } from "./wallet.js";

export type HostMode = "auto" | "api" | "demo";

export type ClientOptions = {
  host: HostMode;
  baseUrl?: string;
  rpcUrl?: string;
  /** Max atomic units of the payment asset (default: 50_000_000 = 50 with 6dp). */
  maxAmount?: bigint;
  quiet?: boolean;
};

export type FetchInit = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

function resolveBase(host: HostMode, wallet: Wallet | null, override?: string): string {
  if (override) return override.replace(/\/$/, "");
  if (host === "api") return API_BASE;
  if (host === "demo") return DEMO_BASE;
  return wallet ? API_BASE : DEMO_BASE;
}

/** Demo marketing host serves the same handlers under /api/*. Paid API host is root paths. */
function withHostPath(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base === DEMO_BASE || (base.includes("milypay.xyz") && !base.includes("api.milypay.xyz"))) {
    if (p.startsWith("/api/") || p === "/api") return `${base}${p}`;
    return `${base}/api${p}`;
  }
  return `${base}${p}`;
}

function log(quiet: boolean | undefined, msg: string) {
  if (!quiet) process.stderr.write(msg + "\n");
}

function fundingHintFromBody(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const b = body as Record<string, unknown>;
  const funding = b.funding as { moneygram?: { demoUi?: string; session?: string } } | undefined;
  const mg = funding?.moneygram;
  if (!mg) return "";
  return [
    "",
    "Underfunded? MoneyGram sandbox can top up USDC (does not settle x402):",
    mg.demoUi ? `  UI:  ${mg.demoUi}` : "  UI:  https://milypay.xyz/fund",
    mg.session
      ? `  API: POST ${mg.session}  {"mode":"on-ramp"}`
      : "  API: POST /ramp/moneygram/session",
    "  CLI: milypay fund session",
  ].join("\n");
}

export async function milypayFetch(
  path: string,
  opts: ClientOptions = { host: "auto" },
  init: FetchInit = {},
): Promise<{ res: Response; base: string; paid: boolean }> {
  const wallet = loadWallet();
  let base = resolveBase(opts.host, wallet, opts.baseUrl);
  let url = path.startsWith("http") ? path : withHostPath(base, path);
  const method = (init.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": "milypay-cli/0.2.5",
    ...(init.headers || {}),
  };
  let body: string | undefined;
  if (init.body !== undefined && method !== "GET" && method !== "HEAD") {
    body = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
    if (!headers["content-type"] && !headers["Content-Type"]) {
      headers["content-type"] = "application/json";
    }
  }

  // Paid path with x402 client (GET primarily; POST paid routes still work if client supports)
  if (wallet && (base.includes("api.milypay.xyz") || opts.host === "api" || Boolean(opts.baseUrl))) {
    log(
      opts.quiet,
      `→ ${method} ${url}  (paying as ${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)})`,
    );
    const client = createX402Client({
      wallet: {
        address: wallet.address,
        signTransaction: wallet.signTransaction,
      },
      network: "solana",
      rpcUrl:
        opts.rpcUrl ||
        process.env.SOLANA_RPC_URL ||
        process.env.HELIUS_RPC_URL ||
        "https://solana-rpc.publicnode.com",
      amount: opts.maxAmount ?? BigInt(50_000_000),
    });
    const res = await client.fetch(url, { method, headers, body });
    return { res, base, paid: true };
  }

  log(opts.quiet, `→ ${method} ${url}${wallet ? "" : "  (demo / free host)"}`);
  let res = await fetch(url, { method, headers, body });

  if (res.status === 402 && !wallet && opts.host === "auto" && base === API_BASE) {
    base = DEMO_BASE;
    url = withHostPath(base, path);
    log(opts.quiet, `402 Payment Required — retrying free demo host`);
    res = await fetch(url, { method, headers, body });
  }

  if (res.status === 402 && !wallet) {
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* keep */
    }
    const err = new Error(
      [
        "Payment required and no wallet configured.",
        "Set MILYPAY_PRIVATE_KEY (base58 secret) to pay on api.milypay.xyz,",
        "or pass --demo to use the free rate-limited host.",
        fundingHintFromBody(parsed),
        text ? `Server: ${text.slice(0, 300)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    throw err;
  }

  return { res, base, paid: false };
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : text.slice(0, 400);
    const hint = fundingHintFromBody(data);
    throw new Error(`HTTP ${res.status}: ${msg}${hint}`);
  }
  return data as T;
}

export async function getJson<T = unknown>(path: string, opts?: ClientOptions): Promise<T> {
  const { res } = await milypayFetch(path, opts);
  return parseJsonResponse<T>(res);
}

export async function postJson<T = unknown>(
  path: string,
  body?: unknown,
  opts?: ClientOptions,
): Promise<T> {
  const { res } = await milypayFetch(path, opts, { method: "POST", body: body ?? {} });
  return parseJsonResponse<T>(res);
}
