import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site";
import PayClient from "./PayClient";

export const metadata: Metadata = {
  title: "Pay with wallet | MilyPay",
  description:
    "Connect a Solana wallet and pay the live x402 fee in AUDD to call a MilyPay endpoint, end to end.",
  alternates: { canonical: "/pay" },
  robots: { index: false },
};

export default function PayPage() {
  return (
    <main className="flex-1">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border-brand">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto max-w-2xl px-6 pb-10 pt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
            Pay with wallet
          </p>
          <h1 className="font-display mt-4 text-4xl leading-[1.08] tracking-tight md:text-5xl">
            Pay per call, in AUDD.
          </h1>
          <p className="mt-5 leading-relaxed text-muted">
            Connect a Solana wallet and run the real x402 round-trip: the request returns a 402,
            your wallet pays the fee in AUDD via the PayAI facilitator, and the data comes back in
            the same call. This is the live paid API, not a simulation.
          </p>
        </div>
      </section>

      <div className="pt-10">
        <PayClient />
      </div>

      <SiteFooter />
    </main>
  );
}
