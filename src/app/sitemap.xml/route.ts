/**
 * Explicit GET+HEAD sitemap so GSC can fetch.
 * Next app/sitemap.ts on OpenNext/CF often HEAD 200 with no Content-Length.
 */
const BASE = "https://milypay.xyz";

const URLS: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/demo", changefreq: "weekly", priority: "0.9" },
  { path: "/docs", changefreq: "weekly", priority: "0.8" },
  { path: "/quickstart", changefreq: "weekly", priority: "0.9" },
  { path: "/status", changefreq: "daily", priority: "0.7" },
  { path: "/pay", changefreq: "weekly", priority: "0.7" },
  { path: "/stables", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/agents.md", changefreq: "weekly", priority: "0.9" },
  { path: "/llms.txt", changefreq: "weekly", priority: "0.8" },
  { path: "/llms-full.txt", changefreq: "weekly", priority: "0.8" },
  { path: "/.well-known/x402", changefreq: "weekly", priority: "0.7" },
  { path: "/.well-known/api-catalog", changefreq: "weekly", priority: "0.7" },
  { path: "/openapi.json", changefreq: "weekly", priority: "0.7" },
  { path: "/mcp", changefreq: "weekly", priority: "0.7" },
  { path: "/dashboard", changefreq: "daily", priority: "0.5" },
  { path: "/fund", changefreq: "weekly", priority: "0.6" },
  { path: "/abn-lookup-api", changefreq: "weekly", priority: "0.9" },
  { path: "/bsb-api", changefreq: "weekly", priority: "0.8" },
  { path: "/asic-company-api", changefreq: "weekly", priority: "0.8" },
  { path: "/gnaf-address-api", changefreq: "weekly", priority: "0.8" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8" },
  { path: "/changelog", changefreq: "weekly", priority: "0.6" },
  { path: "/x402-vs-api-key", changefreq: "monthly", priority: "0.7" },
  { path: "/vs/abr", changefreq: "monthly", priority: "0.7" },
];

function xmlBody(): string {
  const lastmod = new Date().toISOString();
  const urls = URLS.map(
    (u) => `  <url>
    <loc>${BASE}${u.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function headers(byteLen: number): Headers {
  return new Headers({
    "content-type": "application/xml; charset=utf-8",
    "content-length": String(byteLen),
    "cache-control": "public, max-age=300, s-maxage=3600",
    allow: "GET, HEAD",
    "access-control-allow-origin": "*",
  });
}

export function GET() {
  const body = xmlBody();
  const bytes = new TextEncoder().encode(body);
  return new Response(bytes, { status: 200, headers: headers(bytes.byteLength) });
}

export function HEAD() {
  const body = xmlBody();
  const bytes = new TextEncoder().encode(body);
  return new Response(null, { status: 200, headers: headers(bytes.byteLength) });
}
