import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import CodeBlock from "@/components/CodeBlock";

export type ApiLandingProps = {
  title: string;
  description: string;
  canonical: string;
  h1: string;
  lede: string;
  demoPath: string;
  paidPath: string;
  price: string;
  source: string;
  sample: string;
  related?: { href: string; label: string }[];
};

export function apiMetadata(p: Pick<ApiLandingProps, "title" | "description" | "canonical">): Metadata {
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: p.canonical },
    openGraph: { title: p.title, description: p.description, url: `https://milypay.xyz${p.canonical}` },
  };
}

export function ApiLanding(p: ApiLandingProps) {
  const demo = `https://milypay.xyz/api${p.demoPath}`;
  const paid = `https://api.milypay.xyz${p.paidPath}`;
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Milypay · x402</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">{p.h1}</h1>
        <p className="mt-5 text-base leading-relaxed text-muted">{p.lede}</p>

        <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="lab-panel p-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Demo</dt>
            <dd className="mt-1 text-sm">GET milypay.xyz/api… · 200</dd>
          </div>
          <div className="lab-panel p-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Paid</dt>
            <dd className="mt-1 text-sm">GET api.milypay.xyz… · 402</dd>
          </div>
          <div className="lab-panel p-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Price</dt>
            <dd className="mt-1 text-sm">{p.price}</dd>
          </div>
        </dl>

        <h2 className="mt-12 text-xl font-semibold tracking-tight">Try it</h2>
        <p className="mt-2 text-sm text-muted">Free throttled demo. Source: {p.source}.</p>
        <div className="mt-4">
          <CodeBlock code={`curl ${demo}`} />
        </div>

        <h2 className="mt-12 text-xl font-semibold tracking-tight">Paid agents</h2>
        <p className="mt-2 text-sm text-muted">
          Production traffic hits the paid host and settles over x402 (or MPP with ?rail=mpp). No API key.
        </p>
        <div className="mt-4">
          <CodeBlock code={`curl ${paid}\n# HTTP 402 until PAYMENT-SIGNATURE / wallet settle\nnpx milypay --api …`} />
        </div>

        <h2 className="mt-12 text-xl font-semibold tracking-tight">Sample</h2>
        <div className="mt-4">
          <CodeBlock code={p.sample} />
        </div>

        <p className="mt-10 text-sm text-muted">
          <Link href="/docs" className="underline underline-offset-4">
            Docs
          </Link>
          {" · "}
          <Link href="/pricing" className="underline underline-offset-4">
            Pricing
          </Link>
          {" · "}
          <Link href="/agents.md" className="underline underline-offset-4">
            agents.md
          </Link>
          {" · "}
          <Link href="/quickstart" className="underline underline-offset-4">
            Quickstart
          </Link>
        </p>
        {p.related && p.related.length > 0 && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
            {p.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="underline underline-offset-4">
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
      <SiteFooter />
    </main>
  );
}
