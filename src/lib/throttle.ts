// Per-IP rate limiting using the Cloudflare Workers rate-limiting binding.
// Protects the open (pre-x402) API and the upstream ABR GUID quota from abuse.
// Configured in wrangler.jsonc under unsafe.bindings (API_RATE_LIMITER).

import { getCloudflareContext } from "@opennextjs/cloudflare";

interface RateLimiter {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export async function isThrottled(req: Request): Promise<boolean> {
  try {
    const { env } = getCloudflareContext();
    const limiter = (env as unknown as { API_RATE_LIMITER?: RateLimiter }).API_RATE_LIMITER;
    if (!limiter) return false; // not configured -> fail open
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anonymous";
    const { success } = await limiter.limit({ key: ip });
    return !success;
  } catch {
    return false; // never block on limiter errors
  }
}
