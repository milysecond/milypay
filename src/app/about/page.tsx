import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import { MD_ABOUT } from "@/lib/agent-markdown";

export const metadata: Metadata = {
  title: "About Milypay",
  description:
    "Milypay by Milysec — Australian data APIs for AI agents over x402 on Solana. No API keys, pay per call.",
  alternates: { canonical: "/about" },
};

function blocks(md: string) {
  return md.split("\n\n").map((b) => b.trim()).filter(Boolean);
}

export default function AboutPage() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
        {blocks(MD_ABOUT).map((line, i) => {
          if (line.startsWith("# "))
            return (
              <h1 key={i} className="font-display text-4xl tracking-tight md:text-5xl">
                {line.replace(/^#\s+/, "")}
              </h1>
            );
          if (line.startsWith("## "))
            return (
              <h2 key={i} className="mt-10 text-xl font-semibold tracking-tight">
                {line.replace(/^##\s+/, "")}
              </h2>
            );
          if (line.startsWith("- "))
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-5 text-muted">
                {line.split("\n").map((li, j) => (
                  <li key={j}>{li.replace(/^-\s+/, "").replace(/\*\*/g, "")}</li>
                ))}
              </ul>
            );
          return (
            <p key={i} className="mt-4 text-base leading-relaxed text-muted">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        })}
        <p className="mt-12 text-sm text-muted">
          <Link href="/agents.md" className="underline underline-offset-4">
            agents.md
          </Link>
          {" · "}
          <Link href="/contact" className="underline underline-offset-4">
            Contact
          </Link>
          {" · "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy
          </Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
