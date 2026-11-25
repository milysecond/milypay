// Sponsored Helius Privacy Rings endpoints for Milypay payers (beta).
// api.milypay.xyz/ring/{rpc,indexer/<method>,prover/...} -> private milypay-ring Worker.
// Rate-limited per client and capped per day; only Rings-related methods are allowed.
import { ringProxy } from "@/lib/ring";

export const dynamic = "force-dynamic";

const SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,127}$/;

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!Array.isArray(path) || path.length === 0 || path.length > 6 || !path.every((s) => SEGMENT.test(s))) {
    return Response.json({ error: "Not Found", code: "not_found" }, { status: 404 });
  }
  if (!["rpc", "indexer", "prover"].includes(path[0])) {
    return Response.json({ error: "Not Found", code: "not_found" }, { status: 404 });
  }
  const upstream = await ringProxy(req, path.join("/"));
  const headers = new Headers(upstream.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "Spr-Tee, Spr-Tee-Enc, Spr-Tee-Ciphertext, Retry-After");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Milypay-Rail", "helius-rings; beta");
  return new Response(upstream.body, { status: upstream.status, headers });
}

export const GET = handle;
export const POST = handle;
