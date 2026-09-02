import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "Pricing | Milypay",
  description:
    "Milypay pricing: free throttled demo on milypay.xyz/api, pay-per-call x402 on api.milypay.xyz. No API keys, no monthly seat.",
  alternates: { canonical: "/pricing" },
};

const ROWS: { name: string; demo: string; paid: string; href: string }[] = [
  { name: "ABN / ACN lookup", demo: "Free (throttled)", paid: "0.002 AUDD", href: "/abn-lookup-api" },
  { name: "ASIC company search", demo: "Free (throttled)", paid: "0.002 AUDD", href: "/asic-company-api" },
  { name: "G-NAF address", demo: "Free (throttled)", paid: "0.002 AUDD", href: "/gnaf-address-api" },
  { name: "BSB", demo: "Free (throttled)", paid: "0.002 AUDD", href: "/bsb-api" },
  { name: "ABS CPI / series", demo: "Free (throttled)", paid: "0.002–0.005 AUDD", href: "/docs#abs" },
  { name: "Phone line intel", demo: "Free (throttled)", paid: "0.05 AUDD", href: "/docs#phone" },
  { name: "ASIC extract", demo: "Sandbox on apex", paid: "Always paid", href: "/docs#company-report" },
];

export default function PricingPage() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">Pricing</h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          No seats. No API keys. Demo host is free and throttled. Production agents pay per call on
          api.milypay.xyz via x402 (Solana stables) or MPP (?rail=mpp).
        </p>
        <div className="mt-10 overflow-x-auto">
          <table className="min-w-[32rem] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-brand font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                <th className="py-3 pr-4">Surface</th>
                <th className="py-3 pr-4">Demo</th>
                <th className="py-3">Paid</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name} className="border-b border-border-brand/60">
                  <td className="py-3 pr-4">
                    <Link href={r.href} className="underline underline-offset-4">
                      {r.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted">{r.demo}</td>
                  <td className="py-3 font-mono text-brand-green">{r.paid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-8 text-sm text-muted">
          Full catalogue:{" "}
          <Link href="/docs" className="underline underline-offset-4">
            /docs
          </Link>
          {" · "}
          <Link href="/openapi.json" className="underline underline-offset-4">
            OpenAPI
          </Link>
          {" · "}
          <Link href="/changelog" className="underline underline-offset-4">
            Changelog
          </Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
