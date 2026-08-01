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

function resolveBase(host: HostMode, wallet: Wallet | null, override?: string): string {
  if (override) return override.replace(/\/$/, "");
  if (host === "api") return API_BASE;
  if (host === "demo") return DEMO_BASE;
  // auto
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

export async function milypayFetch(
  path: string,
  opts: ClientOptions = { host: "auto" },
): Promise<{ res: Response; base: string; paid: boolean }> {
  const wallet = loadWallet();
  let base = resolveBase(opts.host, wallet, opts.baseUrl);
  let url = path.startsWith("http") ? path : withHostPath(base, path);

  // Paid path with x402 client
  if (wallet && (base.includes("api.milypay.xyz") || opts.host === "api" || Boolean(opts.baseUrl))) {
    log(opts.quiet, `→ ${url}  (paying as ${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)})`);
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
    const res = await client.fetch(url, {
      headers: { accept: "application/json", "user-agent": "milypay-cli/0.1.0" },
    });
    return { res, base, paid: true };
  }

  // Free / demo plain fetch
  log(opts.quiet, `→ ${url}${wallet ? "" : "  (demo / free host)"}`);
  let res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "milypay-cli/0.1.0" },
  });

  // If user forced api without wallet and got 402, fall back to demo once
  if (res.status === 402 && !wallet && opts.host === "auto" && base === API_BASE) {
    base = DEMO_BASE;
    url = withHostPath(base, path);
    log(opts.quiet, `402 Payment Required — retrying free demo host`);
    res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "milypay-cli/0.1.0" },
    });
  }

  if (res.status === 402 && !wallet) {
    const body = await res.text();
    const err = new Error(
      [
        "Payment required and no wallet configured.",
        "Set MILYPAY_PRIVATE_KEY (base58 secret) to pay on api.milypay.xyz,",
        "or pass --demo to use the free rate-limited host.",
        body ? `Server: ${body.slice(0, 300)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    throw err;
  }

  return { res, base, paid: false };
}

export async function getJson<T = unknown>(
  path: string,
  opts?: ClientOptions,
): Promise<T> {
  const { res } = await milypayFetch(path, opts);
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
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return data as T;
}
