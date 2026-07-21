import { NextResponse } from "next/server";

// Machine-readable x402 discovery manifest for Milypay.
// Served at https://milypay.xyz/.well-known/x402 via a rewrite in next.config.ts.
// Lets agents, gateways, and crawlers discover the full service catalogue, pricing,
// settlement asset, and network in one fetch, without scraping the HTML site.

export const dynamic = "force-static";

const ATTRIBUTION = "Milypay - the x402 service provider for Australia. A Milysec company.";

const MANIFEST = {
  x402Version: 2,
  name: "Milypay",
  description:
    "Milypay: pay-per-call Australian government and commercial data for AI agents over x402 on Solana. Settles in AUD (AUDD, AUDM, dAUD) plus USDC/USDT. No API keys, no signup. A Milysec company.",
  provider: { name: "Milysec", url: "https://milysec.com" },
  brand: "Milypay",
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
    // USDC/USDT first for pay.sh registry; AUD rails (AUDD, AUDM, dAUD) for Australian agents.
    assets: [
      {
        symbol: "USDC",
        name: "USD Coin",
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        decimals: 6,
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        decimals: 6,
      },
      {
        symbol: "AUDD",
        name: "Australian Digital Dollar",
        address: "AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw",
        decimals: 6,
      },
      {
        symbol: "AUDM",
        name: "Macropod AUDM",
        address: "CiYXBwHPrdNkMtxR8YEWKv78K6bQjFoEWhPQrZqEmubi",
        decimals: 6,
      },
      {
        symbol: "dAUD",
        name: "dAUD (New Money)",
        address: "F7FiKutfrMMXd8Zw5ysZsfx5v4aBHffWc4EhRZE8NHiF",
        decimals: 9,
      },
    ],
    // Back-compat single asset field (AUD-native default for docs).
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
    { method: "GET", path: "/au-bsb/{bsb}", price: "0.002", description: "BSB lookup: bank name, branch, address, state, postcode, and supported payment methods (paper/electronic/high-value). 17,000+ BSBs from AusPayNet." },
    { method: "GET", path: "/au-bsb/search?q={query}", price: "0.004", description: "Search BSBs by bank name, branch name, or suburb." },
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
