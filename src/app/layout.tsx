import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#f9f8f6",
  colorScheme: "light",
};

const SERVICE_OFFERS: { name: string; price: string; description: string }[] = [
  { name: "Australian business identity (ABN/ACN lookup)", price: "0.002", description: "ABN and ACN lookup and name search from the Australian Business Register." },
  { name: "ASIC company register lookup", price: "0.002", description: "ASIC company lookup by ACN or name: status, type, class, registration dates, former names." },
  { name: "Australian address validation and geocoding", price: "0.004", description: "Validate, search, and geocode any Australian address from G-NAF (16.9M addresses)." },
  { name: "Super fund lookup", price: "0.002", description: "Verify any Australian super fund by ABN: name, status, type, USIs, from the ATO register." },
  { name: "Australian weather forecast", price: "0.001", description: "Current conditions and forecast for any Australian address or coordinate (BOM ACCESS-G via Open-Meteo)." },
  { name: "Australia Post postage rates", price: "0.002", description: "Australia Post parcel rates and service options between postcodes, domestic or international." },
];

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://milypay.xyz/#organization",
      name: "MilyPay",
      url: "https://milypay.xyz",
      logo: "https://milypay.xyz/icon.png",
      description:
        "MilyPay is the x402 service provider for the Australian market, giving AI agents pay-per-call access to Australian data settled in AUD stablecoins. A Milysec company.",
      parentOrganization: { "@type": "Organization", name: "Milysec", url: "https://milysec.com" },
      sameAs: ["https://milysec.com", "https://pay.sh", "https://x402.org"],
    },
    {
      "@type": "WebSite",
      "@id": "https://milypay.xyz/#website",
      url: "https://milypay.xyz",
      name: "MilyPay",
      description:
        "Agentic payments and Australian data on the x402 protocol, settled in AUDD on Solana. No API keys, no signup.",
      publisher: { "@id": "https://milypay.xyz/#organization" },
      inLanguage: "en-AU",
    },
    {
      "@type": "Service",
      "@id": "https://milypay.xyz/#service",
      name: "MilyPay agentic data and payments",
      serviceType: "x402 pay-per-call API access for AI agents",
      provider: { "@id": "https://milypay.xyz/#organization" },
      areaServed: { "@type": "Country", name: "Australia" },
      audience: { "@type": "Audience", audienceType: "AI agents and autonomous software" },
      description:
        "Pay-per-call access to Australian government and commercial data for AI agents over the x402 protocol, settled in AUDD (regulated AUD stablecoin) on Solana, discoverable on Pay.sh. No API keys, no accounts.",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "MilyPay Australian data services",
        itemListElement: SERVICE_OFFERS.map((s) => ({
          "@type": "Offer",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: s.price,
            priceCurrency: "AUD",
            unitText: "per API call",
          },
          itemOffered: { "@type": "Service", name: s.name, description: s.description },
        })),
      },
    },
  ],
};

// Body / UI — Inter (readable, neutral)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

// Headings — Plus Jakarta Sans (geometric, commercial product)
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://milypay.xyz"),
  alternates: {
    canonical: "/",
    types: {
      "text/markdown": [
        { url: "/agents.md", title: "MilyPay for Agents (agents.md)" },
        { url: "/llms.txt", title: "MilyPay (llms.txt)" },
        { url: "/llms-full.txt", title: "MilyPay full reference (llms-full.txt)" },
      ],
    },
  },
  title: {
    default: "MilyPay - Agent payments & Australian data on x402",
    template: "%s",
  },
  description:
    "MilyPay is the x402 service provider for the Australian market. AI agents get pay-per-call access to Australian data - business, company, address, super, weather, postage - settled in AUDD, the regulated AUD-native stablecoin, via the PayAI facilitator and Pay.sh. No API keys, no signup. A Milysec company.",
  keywords: [
    "x402",
    "agent payments",
    "agentic payments",
    "AI agents",
    "AI agent payments",
    "Model Context Protocol",
    "MCP",
    "autonomous agents",
    "LLM tools",
    "pay per call API",
    "Australian data API",
    "ABN lookup API",
    "Australia",
    "AUD",
    "AUDD",
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
  verification: {
    google: "AXY9Pei5H-GIw4Vyn1CV_OQPBxl0X0rwSIAAmqaVzHo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        {children}
      </body>
    </html>
  );
}
