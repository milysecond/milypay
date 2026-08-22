import { NextResponse } from "next/server";

export const dynamic = "force-static";

const CARD = {
  name: "milypay",
  description:
    "Australian data APIs for agents over x402 — ABN, ASIC, G-NAF, ABS, transit, energy, and more. Stdio MCP via npx milypay mcp.",
  vendor: "Milysec",
  homepage: "https://milypay.xyz",
  documentation: "https://milypay.xyz/mcp",
  package: "milypay",
  transport: "stdio",
  command: "npx",
  args: ["-y", "milypay", "mcp"],
  openapi: "https://milypay.xyz/openapi.json",
  x402: "https://milypay.xyz/.well-known/x402",
};

export function GET() {
  return NextResponse.json(CARD, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
