import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "x402 vs API key | Milypay",
  description:
    "Why Milypay uses HTTP 402 (x402) instead of API keys for Australian data. Pay per call, no signup, AUD settlement on Solana.",
  alternates: { canonical: "/x402-vs-api-key" },
};

export default function Page() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">x402 vs API key</h1>
        <p className="mt-5 text-muted leading-relaxed">
          ABR, ASIC, and most AU data vendors still want an account and a key. Agents do not want
          that. x402 returns HTTP 402 with a price; the wallet pays; the body comes back. No key
          to leak, rotate, or provision.
        </p>
        <table className="mt-10 min-w-[32rem] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-brand font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="py-3 pr-4"> </th>
              <th className="py-3 pr-4">API key</th>
              <th className="py-3">x402 (Milypay)</th>
            </tr>
          </thead>
          <tbody className="text-muted">
            <tr className="border-b border-border-brand/60">
              <td className="py-3 pr-4 text-fg">Signup</td>
              <td className="py-3 pr-4">Yes</td>
              <td className="py-3">No</td>
            </tr>
            <tr className="border-b border-border-brand/60">
              <td className="py-3 pr-4 text-fg">Billing</td>
              <td className="py-3 pr-4">Monthly / prepaid</td>
              <td className="py-3">Per call, AUD stables</td>
            </tr>
            <tr className="border-b border-border-brand/60">
              <td className="py-3 pr-4 text-fg">Agent loop</td>
              <td className="py-3 pr-4">Store a secret</td>
              <td className="py-3">Settle 402, retry</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-fg">Demo</td>
              <td className="py-3 pr-4">Often none</td>
              <td className="py-3">
                <code>milypay.xyz/api/…</code> free, throttled
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-8 text-sm text-muted">
          <Link href="/abn-lookup-api" className="underline underline-offset-4">
            ABN lookup API
          </Link>
          {" · "}
          <Link href="/docs" className="underline underline-offset-4">
            Docs
          </Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
