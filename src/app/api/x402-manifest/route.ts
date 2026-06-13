import { NextResponse } from "next/server";

// Machine-readable x402 discovery manifest for MilyPay.
// Served at https://milypay.xyz/.well-known/x402 via a rewrite in next.config.ts.
// Lets agents, gateways, and crawlers discover the full service catalogue, pricing,
// settlement asset, and network in one fetch, without scraping the HTML site.

export const dynamic = "force-static";

const ATTRIBUTION = "MilyPay - the x402 service provider for Australia. A Milysec company.";

const MANIFEST = {
  x402Version: 2,
  name: "MilyPay",
  description:
    "Pay-per-call access to Australian government and commercial data for AI agents over the x402 protocol, settled in AUDD (regulated AUD stablecoin) on Solana. No API keys, no signup.",
  provider: { name: "Milysec", url: "https://milysec.com" },
  homepage: "https://milypay.xyz",
  documentation: "https://milypay.xyz/agents.md",
  llms: "https://milypay.xyz/llms.txt",
  baseUrl: "https://api.milypay.xyz",
  catalog: { registry: "https://pay.sh", namespace: "milysec/*" },
  spec: "https://x402.org",
  payment: {
    scheme: "exact",
    network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    facilitator: "https://facilitator.payai.network",
    payTo: "mi1ytDfgNFYgm54y4f3xzRQbfbyCz6TBmQcAL3brozA",
    asset: {
      symbol: "AUDD",
      name: "Australian Digital Dollar",
      address: "AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw",
      decimals: 6,
    },
    currency: "AUD",
  },
  endpoints: [
    { method: "GET", path: "/au-business/abn/{abn}", price: "0.002", description: "Australian business by ABN (entity name, status, type, ACN, GST, business names, location). Source: ABR." },
    { method: "GET", path: "/au-business/acn/{acn}", price: "0.002", description: "Australian business resolved from an ACN. Source: ABR." },
    { method: "GET", path: "/au-business/search?name={name}", price: "0.004", description: "ABN name search by business or entity name. Source: ABR." },
    { method: "GET", path: "/au-company/acn/{acn}", price: "0.002", description: "ASIC company by ACN: status, type, class, registration dates, former names." },
    { method: "GET", path: "/au-company/search?name={name}", price: "0.004", description: "ASIC company name search (current and former names)." },
    { method: "GET", path: "/au-address/validate?q={address}", price: "0.004", description: "Validate an Australian address against G-NAF. Returns canonical address, GNAF PID, geocode." },
    { method: "GET", path: "/au-address/search?q={query}", price: "0.004", description: "Ranked Australian address matches (autocomplete) from G-NAF." },
    { method: "GET", path: "/au-address/geocode?q={address}", price: "0.004", description: "Latitude and longitude for an Australian address from G-NAF." },
    { method: "GET", path: "/au-super/abn/{abn}", price: "0.002", description: "Super fund lookup by ABN: fund name, status, type, complying status, USIs. Source: ATO." },
    { method: "GET", path: "/au-weather?q={address}", price: "0.001", description: "Current conditions and forecast for an Australian address (BOM ACCESS-G via Open-Meteo)." },
    { method: "GET", path: "/au-weather?lat={lat}&lng={lng}", price: "0.001", description: "Current conditions and forecast for an Australian coordinate." },
    { method: "GET", path: "/au-postage?from={postcode}&to={postcode}&weight={kg}&length={cm}&width={cm}&height={cm}", price: "0.002", description: "Australia Post domestic parcel rates and services between two postcodes." },
    { method: "GET", path: "/au-postage?country={code}&weight={kg}", price: "0.002", description: "Australia Post international parcel rates and services." },
  ],
  attribution: ATTRIBUTION,
};

export function GET() {
  return NextResponse.json(MANIFEST, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "x-data-source": ATTRIBUTION,
    },
  });
}
