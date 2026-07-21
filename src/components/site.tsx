import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "", invert = false }: { className?: string; invert?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="MilyPay home"
      className={`inline-flex items-center gap-2.5 transition hover:opacity-80 ${className}`}
    >
      <Image
        src="/brand/milysec-logo.svg"
        alt=""
        width={28}
        height={28}
        className={`h-7 w-7 ${invert ? "brightness-0 invert" : ""}`}
        priority
      />
      <span className={`font-logo text-xl ${invert ? "text-white" : "text-fg"}`}>
        Mily<span className={invert ? "text-brand-green-bright" : "text-brand-green"}>Pay</span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/#services", label: "Services" },
  { href: "/demo", label: "Demo" },
  { href: "/stables", label: "AUD Stables" },
  { href: "/docs", label: "Docs" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-brand/80 bg-bg/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30 focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://pay.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30 focus-visible:ring-offset-2"
          >
            pay.sh
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/demo"
            className="hidden rounded-full bg-secondary px-4 py-2 text-sm font-medium text-fg transition hover:bg-[#eeebe8] sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30 focus-visible:ring-offset-2"
          >
            Try live
          </Link>
          <Link
            href="/#developers"
            className="rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-fg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 focus-visible:ring-offset-2"
          >
            Start building
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border-brand bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Agent payments and Australian data on x402. Settled in AUD stablecoins.
            A Milysec company.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div>
            <p className="font-medium text-fg">Product</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li><Link href="/#services" className="hover:text-fg">Services</Link></li>
              <li><Link href="/demo" className="hover:text-fg">Live demo</Link></li>
              <li><Link href="/docs" className="hover:text-fg">Docs</Link></li>
              <li><Link href="/pay" className="hover:text-fg">Pay with wallet</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-fg">Company</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li>
                <a href="https://milysec.com" target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                  Milysec
                </a>
              </li>
              <li><Link href="/contact" className="hover:text-fg">Contact</Link></li>
              <li><Link href="/stables" className="hover:text-fg">AUD stables</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-fg">Ecosystem</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li>
                <a href="https://x402.org" target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                  x402
                </a>
              </li>
              <li>
                <a href="https://pay.sh" target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                  pay.sh
                </a>
              </li>
              <li>
                <a href="https://docs.payai.network/x402" target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                  PayAI
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border-brand">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Milysec Pty Ltd. Built for Australia.</p>
          <p>Settled in AUDD on Solana via PayAI.</p>
        </div>
      </div>
    </footer>
  );
}
