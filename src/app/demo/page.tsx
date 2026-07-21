import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import DemoTabs from "./DemoTabs";

export const metadata: Metadata = {
  title: "Live demo - ABN Lookup | Milypay",
  description:
    "Try the live Milypay au-business endpoint. Look up any Australian ABN, ACN, or company name and get real ATO data back. Agents pay per call in AUDD; here it is open to try.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <main className="flex-1">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border-brand">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-20">
          <p className="eyebrow">Live demo</p>
          <h1 className="font-display mt-4 text-4xl leading-[1.08] md:text-5xl">
            Try the live Milypay APIs.
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted">
            Real Australian business and address data, straight from the live endpoints.
            Agents pay per call in AUDD over x402; here it is open for you to try. No keys,
            no signup.
          </p>
          <Link
            href="/pay"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-green hover:underline"
          >
            Or pay the real x402 fee with your Solana wallet -&gt;
          </Link>
        </div>
      </section>

      <div className="pt-10">
        <DemoTabs />
      </div>

      <SiteFooter />
    </main>
  );
}
