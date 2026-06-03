import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="MilyPay home"
      className={`inline-flex items-center gap-2.5 transition hover:opacity-80 ${className}`}
    >
      <Image
        src="/brand/milysec-logo.svg"
        alt="MilyPay"
        width={28}
        height={28}
        className="h-7 w-7"
        priority
      />
      <span className="font-display text-xl tracking-tight">
        Mily<span className="brand-gradient-text">Pay</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-brand bg-bg/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/#services" className="transition hover:text-fg">Services</Link>
          <Link href="/demo" className="transition hover:text-fg">Demo</Link>
          <Link href="/stables" className="transition hover:text-fg">AUD Stables</Link>
          <Link href="/#for-agents" className="transition hover:text-fg">For agents</Link>
          <Link href="/docs" className="transition hover:text-fg">Docs</Link>
          <a
            href="https://pay.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-fg"
          >
            pay.sh ↗
          </a>
        </div>
        <Link
          href="/#developers"
          className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Start building
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border-brand">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted md:flex-row">
        <Logo />
        <p>
          A{" "}
          <a
            href="https://milysec.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline-offset-4 transition hover:text-brand-green hover:underline"
          >
            Milysec
          </a>{" "}
          company · Built for Australia · Settled in AUD stablecoins
        </p>
        <p>© 2026 Milysec Pty Ltd</p>
      </div>
    </footer>
  );
}
