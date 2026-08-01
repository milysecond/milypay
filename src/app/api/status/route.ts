import { NextResponse } from "next/server";
import { bapiEnvFromRequest, businessApiReadiness } from "@/lib/businessapi";

export const dynamic = "force-dynamic";

const RPC = process.env.SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const AUDD = "AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw";
const PAYER = "CJnsfwWEif4G1mWsJWkjoWSuRpoPoCQHWsQdgzEFDufC";

const SERVICES = [
  "au-business",
  "au-company",
  "au-company-report",
  "au-address",
  "au-super",
  "au-weather",
  "au-bsb",
  "au-postage",
  "markets",
] as const;

type Probe = {
  id: string;
  ok: boolean;
  status?: number;
  ms?: number;
  error?: string;
};

async function tokenBalance(owner: string, mint: string): Promise<number> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [owner, { mint }, { encoding: "jsonParsed" }],
    }),
  });
  const d = (await res.json()) as {
    result?: {
      value?: {
        account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } };
      }[];
    };
  };
  return (d.result?.value || []).reduce(
    (s, a) => s + (a.account.data.parsed.info.tokenAmount.uiAmount || 0),
    0,
  );
}

async function probe(path: string, id: string): Promise<Probe> {
  const base =
    process.env.STATUS_PROBE_BASE ||
    // Prefer apex free demo paths for non-destructive checks
    "https://milypay.xyz/api";
  const url = `${base.replace(/\/$/, "")}${path}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "milypay-status/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    const ms = Date.now() - t0;
    // 200 = healthy; 402 on api host also means route is up
    const ok = res.status === 200 || res.status === 402;
    return { id, ok, status: res.status, ms };
  } catch (e) {
    return {
      id,
      ok: false,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : "probe failed",
    };
  }
}

export async function GET(req: Request) {
  const payTo = process.env.PAY_TO_WALLET || "";
  const environment = bapiEnvFromRequest(req);
  const url = new URL(req.url);
  const deep = url.searchParams.get("deep") === "1";

  try {
    const [floatUsdc, receivedAudd, bapi, probes] = await Promise.all([
      tokenBalance(PAYER, USDC),
      payTo ? tokenBalance(payTo, AUDD) : Promise.resolve(0),
      businessApiReadiness({ environment }).catch(() => ({
        configured: Boolean(
          environment === "test"
            ? process.env.BAPI_TEST_SECRET_KEY || process.env.BAPI_SECRET_KEY
            : process.env.BAPI_SECRET_KEY,
        ),
        paidOk: false,
        environment,
        message: "readiness probe failed",
      })),
      deep
        ? Promise.all([
            probe("/au-business/abn/51824753556", "au-business"),
            probe("/au-company/acn/000014675", "au-company"),
            probe("/au-address/geocode?q=1%20bligh%20st%20sydney", "au-address"),
            probe("/au-bsb/012-002", "au-bsb"),
            probe("/au-weather?q=sydney", "au-weather"),
          ])
        : Promise.resolve([] as Probe[]),
    ]);

    const allProbesOk = probes.length === 0 || probes.every((p) => p.ok);
    const overall =
      process.env.X402_ENABLED === "true" && allProbesOk ? "operational" : "degraded";

    return NextResponse.json(
      {
        ok: overall === "operational",
        status: overall,
        checkedAt: new Date().toISOString(),
        services: [...SERVICES],
        pending: ["au-tracking"],
        x402: process.env.X402_ENABLED === "true",
        hosts: {
          site: "https://milypay.xyz",
          api: "https://api.milypay.xyz",
        },
        float: { usdc: floatUsdc },
        receiving: { audd: receivedAudd },
        businessapi: {
          configured: bapi.configured,
          extracts: bapi.paidOk,
          environment: bapi.environment,
          demoSandbox: environment === "test",
        },
        probes: deep ? probes : undefined,
        docs: "https://milypay.xyz/agents.md",
        brand: "Milypay",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: e instanceof Error ? e.message : "status unavailable",
        code: "upstream_error",
        brand: "Milypay",
      },
      { status: 502 },
    );
  }
}
