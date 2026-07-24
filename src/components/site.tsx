"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";

export function Logo({ className = "", invert = false }: { className?: string; invert?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Milypay home"
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
        Mily<span className={invert ? "text-brand-green-bright" : "text-brand-green"}>pay</span>
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

function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("milypay-theme");
    setDark(stored !== "light");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
    localStorage.setItem("milypay-theme", dark ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#070a08" : "#F7F8F7");
  }, [dark, ready]);

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      className={`flex h-9 w-9 items-center justify-center rounded-md border border-border-brand text-muted transition-colors hover:border-brand-green/50 hover:bg-secondary hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${className}`}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4 text-brand-green" /> : <Moon className="h-4 w-4 text-brand-purple" />}
    </button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const linkClass =
    "font-mono text-[11px] tracking-[0.12em] uppercase text-muted transition-colors hover:text-fg px-3 py-2 rounded-md hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-fg focus:shadow-lg"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-border-brand bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}
            <a
              href="https://pay.sh"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              pay.sh
            </a>
            <Link href="/demo" className="ml-2 btn-mono !py-2 !px-3.5">
              Try live
            </Link>
            <Link href="/#developers" className="btn-mono-solid !py-2 !px-3.5">
              Start building
            </Link>
            <ThemeToggle className="ml-1" />
          </div>
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border-brand text-muted transition-colors hover:border-brand-green/50 hover:text-fg"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
        {open && (
          <div className="border-t border-border-brand bg-bg md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="https://pay.sh"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                pay.sh
              </a>
              <div className="mt-2 flex flex-col gap-2 border-t border-border-brand pt-3">
                <Link href="/demo" onClick={() => setOpen(false)} className="btn-mono w-full">
                  Try live
                </Link>
                <Link
                  href="/#developers"
                  onClick={() => setOpen(false)}
                  className="btn-mono-solid w-full"
                >
                  Start building
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border-brand bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Agent payments and Australian data on x402. Settled in AUD stablecoins.
            A Milysec company.
          </p>
          <p className="terminal-line mt-4">
            <span className="prompt">$</span> request → 402 → settle AUDD → data
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div>
            <p className="fig-label mb-3">Product</p>
            <ul className="space-y-2 text-muted">
              <li>
                <Link href="/#services" className="transition-colors hover:text-brand-green">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/demo" className="transition-colors hover:text-brand-green">
                  Live demo
                </Link>
              </li>
              <li>
                <Link href="/docs" className="transition-colors hover:text-brand-green">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="/pay" className="transition-colors hover:text-brand-green">
                  Pay with wallet
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="fig-label mb-3">Company</p>
            <ul className="space-y-2 text-muted">
              <li>
                <a
                  href="https://milysec.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-green"
                >
                  Milysec
                </a>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-brand-green">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/stables" className="transition-colors hover:text-brand-green">
                  AUD stables
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="fig-label mb-3">Ecosystem</p>
            <ul className="space-y-2 text-muted">
              <li>
                <a
                  href="https://x402.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-green"
                >
                  x402
                </a>
              </li>
              <li>
                <a
                  href="https://pay.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-green"
                >
                  pay.sh
                </a>
              </li>
              <li>
                <a
                  href="https://docs.payai.network/x402"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-green"
                >
                  PayAI
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border-brand">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Milysec Pty Ltd. Built for Australia.</p>
          <p className="font-mono tracking-wide">Settled in AUDD on Solana via PayAI.</p>
        </div>
      </div>
    </footer>
  );
}
