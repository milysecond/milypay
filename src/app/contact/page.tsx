import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader, SiteFooter } from "@/components/site";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Talk to us | Milypay",
  description:
    "Get in touch with the Milypay team - list an Australian API, integrate an AUD stablecoin, or ask anything about agent payments on x402.",
  alternates: { canonical: "/contact" },
  robots: { index: true },
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <ContactForm />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
