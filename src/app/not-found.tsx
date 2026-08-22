import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

export default function NotFound() {
  return (
    <main className="flex-1">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto flex min-h-[72vh] max-w-5xl flex-col justify-center px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
            Error 404
          </p>

          <h1 className="font-display mt-4 text-5xl leading-[1.05] tracking-tight md:text-7xl">
            404, not <span className="brand-gradient-text">402</span>.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            This page does not exist, so there is nothing to settle. The only status
            code worth paying for around here is 402, and it lives on real endpoints.
          </p>

          <div className="mt-8 rounded-2xl border border-border-brand bg-card p-5 text-sm leading-relaxed text-muted">
            <p className="font-semibold text-fg">Where agents should look next</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                <Link href="/agents.md" className="underline">
                  /agents.md
                </Link>{" "}
                — full agent guide
              </li>
              <li>
                <Link href="/llms.txt" className="underline">
                  /llms.txt
                </Link>{" "}
                ·{" "}
                <Link href="/openapi.json" className="underline">
                  /openapi.json
                </Link>{" "}
                ·{" "}
                <Link href="/sitemap.xml" className="underline">
                  /sitemap.xml
                </Link>
              </li>
              <li>
                <Link href="/.well-known/x402" className="underline">
                  /.well-known/x402
                </Link>{" "}
                payment catalogue
              </li>
              <li>
                <Link href="/mcp" className="underline">
                  /mcp
                </Link>{" "}
                — stdio MCP via npx milypay mcp
              </li>
            </ul>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="btn-mono-solid text-center">
              Back home
            </Link>
            <Link href="/#services" className="btn-mono text-center">
              Browse services
            </Link>
            <Link href="/docs" className="btn-mono text-center">
              Docs
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
