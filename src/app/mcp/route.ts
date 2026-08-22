import { NextResponse } from "next/server";

export const dynamic = "force-static";

const BODY = `# Milypay MCP

Milypay exposes a **stdio MCP server** (not a hosted HTTP SSE endpoint).

## Run

\`\`\`bash
npx -y milypay mcp
\`\`\`

## Claude / Cursor

\`\`\`json
{
  "mcpServers": {
    "milypay": {
      "command": "npx",
      "args": ["-y", "milypay", "mcp"],
      "env": { "MILYPAY_HOST": "demo" }
    }
  }
}
\`\`\`

Paid tools: set \`MILYPAY_PRIVATE_KEY\` and \`MILYPAY_HOST=api\`.

## Related discovery

- Agents: https://milypay.xyz/agents.md
- OpenAPI: https://milypay.xyz/openapi.json
- x402: https://milypay.xyz/.well-known/x402
- API catalog: https://milypay.xyz/.well-known/api-catalog
- npm: https://www.npmjs.com/package/milypay

A Milysec company.
`;

export function GET(req: Request) {
  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return NextResponse.json(
      {
        brand: "Milypay",
        transport: "stdio",
        command: "npx",
        args: ["-y", "milypay", "mcp"],
        package: "milypay",
        env: {
          demo: { MILYPAY_HOST: "demo" },
          paid: {
            MILYPAY_HOST: "api",
            MILYPAY_PRIVATE_KEY: "<base58 solana secret>",
          },
        },
        docs: "https://milypay.xyz/agents.md",
        openapi: "https://milypay.xyz/openapi.json",
        x402: "https://milypay.xyz/.well-known/x402",
        note: "No hosted MCP HTTP URL — use stdio via npx milypay mcp",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  return new NextResponse(BODY, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
