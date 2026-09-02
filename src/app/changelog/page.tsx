import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "Changelog | Milypay",
  description: "What shipped on Milypay: APIs, x402, MCP, CLI, and settlement rails.",
  alternates: { canonical: "/changelog" },
};

const ENTRIES: { date: string; title: string; body: string }[] = [
  {
    date: "2026-08",
    title: "SEO landings + honest demo",
    body: "Per-API pages for ABN, BSB, ASIC, G-NAF. Homepage demo curl uses milypay.xyz/api (200) and the ATO ABN sample that the API actually returns.",
  },
  {
    date: "2026-08",
    title: "MoneyGram funding",
    body: "Wallet top-up before x402. Does not settle the 402.",
  },
  {
    date: "2026-08",
    title: "MPP opt-in",
    body: "Tempo MPP on api.milypay.xyz via ?rail=mpp. Default remains x402 on Solana.",
  },
];

export default function ChangelogPage() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">Changelog</h1>
        <p className="mt-5 text-muted">Shipped product, not a marketing timeline.</p>
        <ol className="mt-10 space-y-8">
          {ENTRIES.map((e) => (
            <li key={e.title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{e.date}</p>
              <h2 className="mt-1 text-xl font-semibold">{e.title}</h2>
              <p className="mt-2 text-muted">{e.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-12 text-sm text-muted">
          <Link href="/docs" className="underline underline-offset-4">
            Docs
          </Link>
          {" · "}
          <Link href="/pricing" className="underline underline-offset-4">
            Pricing
          </Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
