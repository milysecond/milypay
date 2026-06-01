import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site";
import DemoTabs from "./DemoTabs";

export const metadata: Metadata = {
  title: "Live demo - ABN Lookup | MilyPay",
  description:
    "Try the live MilyPay au-business endpoint. Look up any Australian ABN, ACN, or company name and get real ATO data back. Agents pay per call in AUDD; here it is open to try.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <main className="flex-1">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border-brand">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
            Live demo
          </p>
          <h1 className="font-display mt-4 text-4xl leading-[1.08] tracking-tight md:text-5xl">
            Try the live MilyPay APIs.
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted">
            Real Australian business and address data, straight from the live endpoints.
            Agents pay per call in AUDD over x402; here it is open for you to try. No keys,
            no signup.
          </p>
        </div>
      </section>

      <div className="pt-10">
        <DemoTabs />
      </div>

      <SiteFooter />
    </main>
  );
}
