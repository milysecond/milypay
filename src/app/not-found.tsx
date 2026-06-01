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

          <div className="mt-10 max-w-2xl overflow-hidden rounded-2xl border border-border-brand bg-card">
            <div className="flex items-center gap-2 border-b border-border-brand px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-brand-purple/60" />
              <span className="h-3 w-3 rounded-full bg-brand-green/60" />
              <span className="h-3 w-3 rounded-full bg-muted/30" />
              <span className="ml-2 text-xs text-muted">agent &#8596; milypay</span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
              <code>
{`$ curl https://milypay.xyz/this-page-does-not-exist

`}<span className="text-brand-purple">HTTP/1.1 404 Not Found</span>{`
x-402-price:    0.00 AUDD
x-402-reason:   nothing to settle here

`}<span className="text-muted"># 402 Payment Required lives on real endpoints. Try one:</span>
              </code>
            </pre>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-full bg-brand-green px-6 py-3 text-center text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Back home
            </Link>
            <Link
              href="/#services"
              className="rounded-full border border-border-brand bg-card px-6 py-3 text-center text-sm font-semibold text-fg transition hover:border-brand-green/40"
            >
              Browse services
            </Link>
            <Link
              href="/stables"
              className="rounded-full border border-border-brand bg-card px-6 py-3 text-center text-sm font-semibold text-fg transition hover:border-brand-green/40"
            >
              AUD stablecoins
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
