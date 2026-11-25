/**
 * Upstream health for /status, plus clean 503 helpers.
 * Probes are cheap (no billable lookups) and cached per isolate for 5 minutes.
 */
import { apiError } from "@/lib/errors";
import { getNemSummary } from "@/lib/energy";
import { uberHealthy } from "@/lib/rides";
import { createMoneyGramSession } from "@/lib/moneygram";
import { checkifyConfigured } from "@/lib/checkify";

export function energyUnavailable(e?: unknown) {
  if (e) console.error("aemo failed", e instanceof Error ? e.message.slice(0, 80) : "error");
  return apiError(503, "service_unavailable", "AEMO energy data temporarily unavailable");
}

export type UpstreamStatus = { id: string; service: string; ok: boolean; checkedAt: string };

const TTL_MS = 5 * 60_000;
let cache: { at: number; value: UpstreamStatus[] } | null = null;

function soft(p: Promise<boolean>, ms = 6_000): Promise<boolean> {
  return Promise.race([
    p.catch(() => false),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), ms)),
  ]);
}

/** Twilio account status endpoint is free (no Lookup charge). */
async function twilioHealthy(): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) return false;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}.json`, {
    headers: { Authorization: "Basic " + btoa([sid, token].join(":")), Accept: "application/json" },
    signal: AbortSignal.timeout(6_000),
  });
  if (!res.ok) return false;
  const d = (await res.json().catch(() => ({}))) as { status?: string };
  return d.status === "active";
}

async function aemoHealthy(): Promise<boolean> {
  await getNemSummary();
  return true;
}

/** MoneyGram sandbox session mint (same call the /fund demo makes). */
async function moneygramHealthy(): Promise<boolean> {
  await createMoneyGramSession("on-ramp");
  return true;
}

export async function upstreamHealth(): Promise<UpstreamStatus[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const checkedAt = new Date().toISOString();
  const [aemo, uber, twilio, moneygram] = await Promise.all([
    soft(aemoHealthy()),
    soft(uberHealthy()),
    soft(twilioHealthy()),
    soft(moneygramHealthy(), 8_000),
  ]);
  const value: UpstreamStatus[] = [
    { id: "aemo", service: "au-energy", ok: aemo, checkedAt },
    { id: "uber", service: "au-rides", ok: uber, checkedAt },
    { id: "twilio", service: "au-phone", ok: twilio, checkedAt },
    { id: "moneygram", service: "ramp/moneygram", ok: moneygram, checkedAt },
    { id: "checkify", service: "au-check", ok: checkifyConfigured(), checkedAt },
  ];
  cache = { at: Date.now(), value };
  return value;
}
