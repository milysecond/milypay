import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0a0f0a",
  colorScheme: "dark",
};

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MilyPay",
  url: "https://milypay.xyz",
  logo: "https://milypay.xyz/icon.png",
  description:
    "Agent payments and Australian data on x402, settled in AUD stablecoins. A Milysec company.",
  parentOrganization: { "@type": "Organization", name: "Milysec", url: "https://milysec.com" },
  sameAs: ["https://milysec.com", "https://pay.sh"],
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://milypay.xyz"),
  alternates: {
    canonical: "/",
    types: {
      "text/markdown": [
        { url: "/agents.md", title: "MilyPay for Agents (agents.md)" },
        { url: "/llms.txt", title: "MilyPay (llms.txt)" },
      ],
    },
  },
  title: {
    default: "MilyPay - Agent payments & Australian data on x402",
    template: "%s",
  },
  description:
    "MilyPay is the x402 service provider for the Australian market. Pay-per-call Australian data settled in AUDD - the regulated AUD-native stablecoin - via the PayAI facilitator and Pay.sh. A Milysec company.",
  keywords: [
    "x402",
    "agent payments",
    "Australia",
    "AUD",
    "pay.sh",
    "Milysec",
    "MilyPay",
    "Solana",
    "stablecoin",
  ],
  openGraph: {
    title: "MilyPay - Agent payments & Australian data on x402",
    description:
      "Pay-per-call Australian data and AUD-settled micropayments for AI agents, on the x402 rail. A Milysec company.",
    url: "https://milypay.xyz",
    siteName: "MilyPay",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MilyPay - Agent payments & Australian data on x402",
    description:
      "Pay-per-call Australian data and AUD-settled micropayments for AI agents, on the x402 rail.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        {children}
      </body>
    </html>
  );
}
