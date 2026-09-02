import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "Milypay vs ABR | ABN lookup for agents",
  description:
    "ABR (abr.business.gov.au) is the source. Milypay is the x402 API on top: pay-per-call ABN lookup for agents, no ABR account.",
  alternates: { canonical: "/vs/abr" },
};

export default function Page() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">Milypay vs ABR</h1>
        <p className="mt-5 text-muted leading-relaxed">
          The Australian Business Register is the source of ABN records. Humans use
          abr.business.gov.au. Agents should not scrape it. Milypay wraps ABR data as HTTP 402
          pay-per-call JSON.
        </p>
        <ul className="mt-8 list-disc space-y-2 pl-5 text-muted">
          <li>ABR website: search UI, GUID, no x402.</li>
          <li>Milypay: GET /au-business/abn/{"{abn}"} , JSON, demo on milypay.xyz/api, paid on api.milypay.xyz.</li>
          <li>Attribution stays with ABR / ATO. We sell the agent rail, not the register.</li>
        </ul>
        <p className="mt-8 text-sm">
          <Link href="/abn-lookup-api" className="underline underline-offset-4">
            ABN lookup API
          </Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
