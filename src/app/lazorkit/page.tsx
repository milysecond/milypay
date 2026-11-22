import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";

const TITLE = "LazorKit - the authorization layer Milypay sits on | Milypay";
const DESCRIPTION =
  "Milypay settles what LazorKit authorizes. LazorKit is open-source Solana passkey infrastructure the Milypay founder helped co-build: biometrics in, scoped spend out, auditable on-chain.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/lazorkit" },
  openGraph: {
    title: "Milypay settles what LazorKit authorizes",
    description: DESCRIPTION,
    url: "https://milypay.xyz/lazorkit",
    siteName: "Milypay",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Milypay settles what LazorKit authorizes",
    description: DESCRIPTION,
    creator: "@1milysec",
    site: "@1milysec",
  },
};

const FEATURES: { kicker: string; title: string; body: string }[] = [
  {
    kicker: "Auth",
    title: "Passkeys, not seed phrases",
    body: "Users sign in with a device-bound WebAuthn credential: Face ID, Touch ID, or Windows Hello. Keys stay on the device. There is no seed phrase to store or lose.",
  },
  {
    kicker: "Gas",
    title: "Gasless by default",
    body: "A Kora paymaster can sponsor network fees so the user does not need SOL in the wallet to transact. The integrating app funds gas and recoups it through the product.",
  },
  {
    kicker: "Limits",
    title: "Session keys with on-chain caps",
    body: "A single approval can mint a scoped session key. Spending limits, program allow-lists and expiry are enforced on-chain, so later transactions can run without another biometric prompt.",
  },
  {
    kicker: "Roles",
    title: "Owner, Admin, Delegate",
    body: "Protocol v2 separates rank from spending policy. Owner and Admin manage the wallet; a Delegate (the SDK still calls this role Spender) can only spend inside its policy. Rank was not checked on Execute in v1.",
  },
  {
    kicker: "Agents",
    title: "Scoped delegation for agents",
    body: "An owner or admin can hand a session key to an app or an AI agent, limited by program, amount and time, and revoke it later. The agent never holds the user's passkey.",
  },
];

const STATUS: { label: string; value: string; note: string }[] = [
  {
    label: "Protocol v1",
    value: "Live on mainnet",
    note: "Program LazorjRF…, shipped April 2026. The public monorepo still carries a pre-audit caution: “Pre-audit. Do not use in production.”",
  },
  {
    label: "Protocol v2",
    value: "Audited, devnet only",
    note: "Audited by Accretion in a Solana Foundation engagement (report A26SFR1, February 2026; the project reports all 17 findings remediated). Live on devnet. The v2 mainnet program, LazorFroi…, was not deployed as of 23 November 2026.",
  },
  {
    label: "Mainnet v1 usage",
    value: "450 wallets · 3,974 transactions",
    note: "All-time figures from the official LazorKit protocol dashboard, complete through 23 November 2026, 8:46am Australia/Melbourne. 425 of those wallets were created with a passkey. 3,942 of the transactions succeeded.",
  },
];

const TEMPLATES: { href: string; name: string; detail: string }[] = [
  {
    href: "https://templates.solana.com/lazorkit-starter-next",
    name: "LazorKit Starter (Next.js)",
    detail: "Official Solana Foundation catalog · community template",
  },
  {
    href: "https://templates.solana.com/lazorkit-starter-expo",
    name: "LazorKit Starter (Expo)",
    detail: "Official Solana Foundation catalog · community template",
  },
  {
    href: "https://templates.solana.com/lazorkit-starter-vite",
    name: "LazorKit Starter (Vite)",
    detail: "Same catalog, also listed",
  },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-fg">{value}</dd>
    </div>
  );
}

export default function LazorkitPage() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border-brand">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
            Infrastructure
          </p>
          <h1 className="font-display mt-4 max-w-4xl text-4xl leading-[1.08] tracking-tight md:text-6xl">
            Milypay settles what <span className="brand-gradient-text">LazorKit authorizes.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Biometrics in, scoped spend out, auditable on-chain. LazorKit is the
            authentication and permission layer Milypay sits on top of: once a
            payment is authorized, Milypay settles it for Australian data.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="fig-label">The fit</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">
              Authorization, then settlement
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
              <p>
                LazorKit is open-source passkey smart-wallet infrastructure for
                Solana. Official docs describe it as an execution layer: it
                handles authentication, permission enforcement, fee routing and
                transaction submission. Applications and agents build on top of
                it. It is MIT-licensed, published at{" "}
                <a
                  href="https://github.com/lazor-kit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fg underline underline-offset-4 hover:text-brand-green"
                >
                  github.com/lazor-kit
                </a>{" "}
                and documented at{" "}
                <a
                  href="https://docs.lazorkit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fg underline underline-offset-4 hover:text-brand-green"
                >
                  docs.lazorkit.com
                </a>
                .
              </p>
              <p>
                The Milypay founder helped co-build that infrastructure and ship
                protocol v1 to Solana mainnet. We position LazorKit as the
                authorization layer in this stack, not as a finished product the
                founder personally guarantees, and not as a wallet integration
                already running inside milypay.xyz. The live Milypay app settles
                x402 payments via PayAI; a LazorKit wallet is not wired into
                production today.
              </p>
              <p>
                lazorkit.com states that LazorKit is supported by the Solana
                Foundation. Separately, the Foundation lists official starter
                templates for LazorKit in its public catalog &mdash; an unpaid
                third-party listing, not a paid placement.
              </p>
            </div>
          </div>

          <dl className="grid gap-px border border-border-brand bg-border-brand sm:grid-cols-2">
            <div className="bg-card p-6">
              <Field label="License" value="MIT" />
            </div>
            <div className="bg-card p-6">
              <Field label="Network" value="Solana" />
            </div>
            <div className="bg-card p-6">
              <Field label="Auth" value="WebAuthn passkeys" />
            </div>
            <div className="bg-card p-6">
              <Field label="Paymaster" value="Kora" />
            </div>
            <div className="bg-card p-6 sm:col-span-2">
              <Field
                label="Site and source"
                value="lazorkit.com · github.com/lazor-kit"
              />
            </div>
          </dl>
        </div>
      </section>

      <section className="border-y border-border-brand bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="fig-label">Status, stated carefully</p>
          <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">
            Shipped to mainnet. v2 is not there yet.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Two protocol versions exist, at different program ids. What is live,
            audited, or still pending is below, checked against public docs, the
            protocol dashboard and Solana mainnet on 23 November 2026.
          </p>
          <div className="mt-10 grid gap-px border border-border-brand bg-border-brand md:grid-cols-3">
            {STATUS.map((s) => (
              <div key={s.label} className="bg-card p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-green">
                  {s.label}
                </p>
                <h3 className="font-display mt-3 text-xl tracking-tight">{s.value}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            Usage numbers come from{" "}
            <a
              href="https://lazorkit-protocol-dashboard.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-brand-green"
            >
              the official LazorKit protocol dashboard
            </a>{" "}
            (all-time mainnet v1: 450 wallets created, 3,974 transactions).
            Marketing figures shown on lazorkit.com were not used here because
            they do not match that dashboard.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="fig-label">Capabilities</p>
        <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">
          What the layer does
        </h2>
        <div className="mt-10 grid gap-px border border-border-brand bg-border-brand md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card p-6 md:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-green">
                {f.kicker}
              </p>
              <h3 className="font-display mt-3 text-xl tracking-tight">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border-brand bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="fig-label">Third-party listing</p>
          <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">
            Official Solana starter templates
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            The Solana Foundation lists LazorKit starters in its public template
            catalog (community templates in{" "}
            <a
              href="https://github.com/solana-foundation/templates/blob/main/TEMPLATES.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg underline underline-offset-4 hover:text-brand-green"
            >
              solana-foundation/templates
            </a>
            ). That is an unpaid catalog listing, not a paid endorsement.
            Create one with{" "}
            <code className="font-mono text-xs text-fg">
              pnpm create solana-dapp@latest -t lazorkit-starter-next
            </code>{" "}
            or{" "}
            <code className="font-mono text-xs text-fg">lazorkit-starter-expo</code>.
          </p>
          <ul className="mt-8 divide-y divide-border-brand border border-border-brand">
            {TEMPLATES.map((t) => (
              <li key={t.href} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                <a
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fg underline-offset-4 hover:text-brand-green hover:underline"
                >
                  {t.name}
                </a>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  {t.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-start justify-between gap-8 border border-border-brand bg-cream p-8 md:flex-row md:items-center md:p-10">
          <div className="max-w-xl">
            <p className="section-label">Sources</p>
            <h2 className="font-display mt-2 text-2xl tracking-tight md:text-3xl">
              Read the protocol, not just this page.
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Status and capabilities above follow public docs, the protocol
              dashboard, the Accretion audit PDF, and a mainnet account check
              on 23 November 2026. When v2 lands on mainnet, those sources
              should be checked first.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {[
                { href: "https://www.lazorkit.com/", label: "lazorkit.com" },
                { href: "https://docs.lazorkit.com/", label: "Docs" },
                { href: "https://docs.lazorkit.com/networks", label: "Networks & versions" },
                { href: "https://github.com/lazor-kit/lazor-kit", label: "GitHub monorepo" },
                {
                  href: "https://github.com/lazor-kit/lazorkit-protocol/blob/main/audits/2026-accretion-solana-foundation-lazorkit-audit-A26SFR1.pdf",
                  label: "Accretion audit (PDF)",
                },
                {
                  href: "https://lazorkit-protocol-dashboard.vercel.app",
                  label: "Protocol dashboard",
                },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted underline underline-offset-4 transition-colors hover:text-brand-green"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <Link href="/protocols" className="btn-primary shrink-0">
            How Milypay settles
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
