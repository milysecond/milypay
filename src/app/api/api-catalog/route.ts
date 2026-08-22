import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * RFC 9727-style API catalog (linkset) for agent discovery.
 */
const CATALOG = {
  linkset: [
    {
      anchor: "https://milypay.xyz/",
      "service-desc": [
        {
          href: "https://milypay.xyz/openapi.json",
          type: "application/vnd.oai.openapi+json",
          title: "Milypay OpenAPI 3.1",
        },
        {
          href: "https://api.milypay.xyz/openapi.json",
          type: "application/vnd.oai.openapi+json",
          title: "Milypay OpenAPI (API host)",
        },
      ],
      "service-doc": [
        {
          href: "https://milypay.xyz/agents.md",
          type: "text/markdown",
          title: "Milypay for Agents",
        },
        {
          href: "https://milypay.xyz/llms.txt",
          type: "text/plain",
          title: "llms.txt",
        },
        {
          href: "https://milypay.xyz/llms-full.txt",
          type: "text/plain",
          title: "llms-full.txt",
        },
        {
          href: "https://milypay.xyz/docs",
          type: "text/html",
          title: "Human docs",
        },
      ],
      status: [
        {
          href: "https://milypay.xyz/api/status",
          type: "application/json",
          title: "Service status",
        },
      ],
      describedby: [
        {
          href: "https://milypay.xyz/.well-known/x402",
          type: "application/json",
          title: "x402 payment catalogue",
        },
        {
          href: "https://milypay.xyz/api/x402-manifest",
          type: "application/json",
          title: "x402 manifest (alias)",
        },
      ],
      api: [
        {
          href: "https://api.milypay.xyz/",
          type: "application/json",
          title: "Paid API base (x402)",
        },
        {
          href: "https://milypay.xyz/api/",
          type: "application/json",
          title: "Demo API base (rate-limited)",
        },
      ],
      "x-mcp": [
        {
          href: "https://milypay.xyz/mcp",
          type: "text/markdown",
          title: "MCP install instructions (stdio via npx milypay mcp)",
        },
      ],
      "x-cli": [
        {
          href: "https://www.npmjs.com/package/milypay",
          type: "text/html",
          title: "milypay CLI + MCP on npm",
        },
      ],
      "x-sdk": [
        {
          href: "https://www.npmjs.com/package/milypay-sdk",
          type: "text/html",
          title: "milypay-sdk TypeScript client",
        },
      ],
    },
  ],
  brand: "Milypay",
  provider: "Milysec",
  note: "Australian data APIs for agents. Pay with x402 (no API keys).",
};

export function GET() {
  return NextResponse.json(CATALOG, {
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      Link: '</.well-known/api-catalog>; rel="api-catalog"',
    },
  });
}
