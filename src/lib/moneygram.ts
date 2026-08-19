/**
 * MoneyGram Ramps — fund wallet before x402 settle (sandbox/demo).
 *
 * Env (optional on Milypay; falls back to proxying sol.new):
 *   MONEYGRAM_RAMPS_PUBLIC_KEY / MONEYGRAM_PK
 *   MONEYGRAM_RAMPS_SECRET_KEY / MONEYGRAM_SK
 *   MONEYGRAM_RAMPS_ENV = sandbox | production
 *   MONEYGRAM_SESSION_PROXY = https://sol.new/api/moneygram/session
 */

export type MoneyGramEnv = "sandbox" | "production";

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function moneygramConfigured(): boolean {
  return Boolean(
    env("MONEYGRAM_RAMPS_SECRET_KEY") ||
      env("MONEYGRAM_SK") ||
      env("MONEYGRAM_SESSION_PROXY") ||
      true, // sol.new proxy always available for demo
  );
}

export function moneygramHasLocalKeys(): boolean {
  return Boolean(env("MONEYGRAM_RAMPS_SECRET_KEY") || env("MONEYGRAM_SK"));
}

export function moneygramEnv(): MoneyGramEnv {
  const forced = (env("MONEYGRAM_RAMPS_ENV") || "").toLowerCase();
  if (forced === "production" || forced === "prod" || forced === "live") {
    return "production";
  }
  const sk = env("MONEYGRAM_RAMPS_SECRET_KEY") || env("MONEYGRAM_SK") || "";
  const pk = env("MONEYGRAM_RAMPS_PUBLIC_KEY") || env("MONEYGRAM_PK") || "";
  if (/live|prod/i.test(sk) || /live|prod/i.test(pk)) return "production";
  return "sandbox";
}

export function moneygramSessionUrl(): string {
  if (moneygramEnv() === "production") {
    return (
      env("MONEYGRAM_RAMPS_SESSION_URL") ||
      "https://api.xramps.moneygram.com/api/v1/sessions"
    );
  }
  return (
    env("MONEYGRAM_RAMPS_SESSION_URL") ||
    "https://playground.xramps.moneygram.com/api/v1/sessions"
  );
}

export function moneygramSdkUrl(): string {
  if (moneygramEnv() === "production") {
    return (
      env("MONEYGRAM_RAMPS_SDK_URL") ||
      "https://api.xramps.moneygram.com/sdk/index.global.js"
    );
  }
  return (
    env("MONEYGRAM_RAMPS_SDK_URL") ||
    "https://playground.xramps.moneygram.com/sdk/index.global.js"
  );
}

export type RampMode = "on-ramp" | "off-ramp";

export type MoneyGramSession = {
  sessionId: string;
  sessionToken: string;
  widgetUrl: string;
  sdkUrl: string;
  env: MoneyGramEnv;
  mode: RampMode;
  walletType?: string;
  source: "local" | "proxy";
  demo: boolean;
};

function preferMode(widgetUrl: string, mode: RampMode): string {
  try {
    const u = new URL(widgetUrl);
    u.searchParams.set("mode", mode);
    return u.toString();
  } catch {
    return widgetUrl.includes("mode=")
      ? widgetUrl.replace(/mode=[^&]+/, `mode=${mode}`)
      : `${widgetUrl}${widgetUrl.includes("?") ? "&" : "?"}mode=${mode}`;
  }
}

async function createLocalSession(mode: RampMode): Promise<MoneyGramSession> {
  const secret = env("MONEYGRAM_RAMPS_SECRET_KEY") || env("MONEYGRAM_SK");
  if (!secret) throw new Error("MoneyGram secret not configured");

  const res = await fetch(moneygramSessionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": secret,
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    sessionId?: string;
    sessionToken?: string;
    widgetUrl?: string;
    walletType?: string;
    error?: string;
    message?: string;
  };

  if (!res.ok || !data.sessionToken || !data.widgetUrl) {
    throw new Error(
      data.error || data.message || `MoneyGram session failed (${res.status})`,
    );
  }

  return {
    sessionId: data.sessionId || "",
    sessionToken: data.sessionToken,
    widgetUrl: preferMode(data.widgetUrl, mode),
    sdkUrl: moneygramSdkUrl(),
    env: moneygramEnv(),
    mode,
    walletType: data.walletType,
    source: "local",
    demo: moneygramEnv() === "sandbox",
  };
}

async function createProxySession(mode: RampMode): Promise<MoneyGramSession> {
  const proxy =
    env("MONEYGRAM_SESSION_PROXY") || "https://sol.new/api/moneygram/session";
  const res = await fetch(proxy, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Milypay-MoneyGram-Proxy/1.0",
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    sessionId?: string;
    sessionToken?: string;
    widgetUrl?: string;
    sdkUrl?: string;
    env?: string;
    error?: string;
  };
  if (!res.ok || !data.sessionToken || !data.widgetUrl) {
    throw new Error(data.error || `MoneyGram proxy failed (${res.status})`);
  }
  return {
    sessionId: data.sessionId || "",
    sessionToken: data.sessionToken,
    widgetUrl: preferMode(data.widgetUrl, mode),
    sdkUrl: data.sdkUrl || moneygramSdkUrl(),
    env: data.env === "production" ? "production" : "sandbox",
    mode,
    source: "proxy",
    demo: true,
  };
}

export async function createMoneyGramSession(
  mode: RampMode = "on-ramp",
): Promise<MoneyGramSession> {
  if (moneygramHasLocalKeys()) {
    try {
      return await createLocalSession(mode);
    } catch (e) {
      // fall through to proxy for demo resilience
      console.error("[moneygram local]", e);
    }
  }
  return createProxySession(mode);
}

/** Structured funding hint embedded in 402 JSON + challenge extensions. */
export function x402FundingHint(priceUsd?: string) {
  const demo = moneygramEnv() === "sandbox" || !moneygramHasLocalKeys();
  return {
    moneygram: {
      enabled: true,
      demo,
      env: moneygramEnv(),
      role: "fund_wallet_before_x402",
      note: "MoneyGram does not settle x402. On-ramp USDC into your Solana wallet, then retry with PAYMENT-SIGNATURE.",
      session: "https://api.milypay.xyz/ramp/moneygram/session",
      sessionPost: {
        method: "POST",
        body: { mode: "on-ramp" },
      },
      demoUi: "https://milypay.xyz/fund",
      suggestedFiat: "USD",
      minFiatAmount: "5.00",
      shortfallHintUsd: priceUsd || undefined,
      assetsAfterRamp: ["USDC"],
      network: "solana:mainnet",
    },
  };
}
