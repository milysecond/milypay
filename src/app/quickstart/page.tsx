import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import CodeBlock from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Quickstart — Claude & Cursor | Milypay",
  description:
    "Paste-ready MCP config for Claude Desktop and Cursor. Australian data tools for agents via npx milypay mcp.",
  alternates: { canonical: "/quickstart" },
};

const MCP_JSON = `{
  "mcpServers": {
    "milypay": {
      "command": "npx",
      "args": ["-y", "milypay", "mcp"],
      "env": {
        "MILYPAY_HOST": "demo"
      }
    }
  }
}`;

const PAID_JSON = `{
  "mcpServers": {
    "milypay": {
      "command": "npx",
      "args": ["-y", "milypay", "mcp"],
      "env": {
        "MILYPAY_HOST": "api",
        "MILYPAY_PRIVATE_KEY": "<base58-secret>"
      }
    }
  }
}`;

const CLI = `npx milypay abn 51824753556
npx milypay nem
npx milypay transit seq summary
npx milypay cpi
npx milypay services
npx milypay mcp`;

export default function QuickstartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="section-label">Quickstart</p>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-fg">
          Claude & Cursor in 60 seconds
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Drop Milypay into any MCP client. Free demo host by default — no wallet, no signup.
          Paid API settles in AUDD/USDC on Solana when you add a key.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl tracking-tight">1. Free MCP (demo)</h2>
          <p className="mt-2 text-sm text-muted">
            Claude Desktop: paste into{" "}
            <code className="text-brand-purple">claude_desktop_config.json</code>. Cursor: MCP
            settings JSON.
          </p>
          <div className="mt-4">
            <CodeBlock code={MCP_JSON} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl tracking-tight">2. Paid API</h2>
          <p className="mt-2 text-sm text-muted">
            Set a Solana secret and force the paid host. Per-call settlement via x402.
          </p>
          <div className="mt-4">
            <CodeBlock code={PAID_JSON} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl tracking-tight">3. CLI</h2>
          <div className="mt-4">
            <CodeBlock code={CLI} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl tracking-tight">Tools you get</h2>
          <ul className="mt-4 grid gap-2 font-mono text-sm text-muted sm:grid-cols-2">
            {[
              "lookup_abn",
              "lookup_company",
              "address_validate",
              "address_geocode",
              "weather",
              "lookup_bsb",
              "postage",
              "list_services",
            ].map((t) => (
              <li key={t} className="border border-border-brand bg-card px-3 py-2 text-fg">
                {t}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12 text-sm text-muted">
          Full reference:{" "}
          <Link href="/agents.md" className="text-brand-green hover:underline">
            agents.md
          </Link>
          {" · "}
          <Link href="/docs" className="text-brand-green hover:underline">
            docs
          </Link>
          {" · "}
          <Link href="/status" className="text-brand-green hover:underline">
            status
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
