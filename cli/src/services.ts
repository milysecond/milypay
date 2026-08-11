/** Catalogue of Milypay endpoints (mirrors /.well-known/x402). */

export type Service = {
  id: string;
  path: string;
  price: string;
  description: string;
};

export const SERVICES: Service[] = [
  {
    id: "au-business/abn",
    path: "/au-business/abn/{abn}",
    price: "0.002",
    description: "Australian business by ABN (ABR)",
  },
  {
    id: "au-business/acn",
    path: "/au-business/acn/{acn}",
    price: "0.002",
    description: "Australian business by ACN (ABR)",
  },
  {
    id: "au-business/search",
    path: "/au-business/search?name={name}",
    price: "0.004",
    description: "ABN name search",
  },
  {
    id: "au-company/acn",
    path: "/au-company/acn/{acn}",
    price: "0.002",
    description: "ASIC company by ACN (open data)",
  },
  {
    id: "au-company/search",
    path: "/au-company/search?name={name}",
    price: "0.004",
    description: "ASIC company name search",
  },
  {
    id: "au-company-report",
    path: "/au-company-report?acn={acn}",
    price: "12.00",
    description: "Official ASIC company extract (paid DSP)",
  },
  {
    id: "au-address/validate",
    path: "/au-address/validate?q={address}",
    price: "0.004",
    description: "Validate Australian address (G-NAF)",
  },
  {
    id: "au-address/search",
    path: "/au-address/search?q={query}",
    price: "0.004",
    description: "Address autocomplete (G-NAF)",
  },
  {
    id: "au-address/geocode",
    path: "/au-address/geocode?q={address}",
    price: "0.004",
    description: "Geocode Australian address",
  },
  {
    id: "au-super/abn",
    path: "/au-super/abn/{abn}",
    price: "0.002",
    description: "Super fund by ABN (ATO)",
  },
  {
    id: "au-weather",
    path: "/au-weather?q={address}",
    price: "0.001",
    description: "Weather for Australian address",
  },
  {
    id: "au-postage",
    path: "/au-postage?from={pc}&to={pc}&weight={kg}",
    price: "0.002",
    description: "Australia Post parcel rates",
  },
  {
    id: "au-bsb",
    path: "/au-bsb/{bsb}",
    price: "0.002",
    description: "BSB lookup (AusPayNet)",
  },
  {
    id: "au-bsb/search",
    path: "/au-bsb/search?q={query}",
    price: "0.004",
    description: "Search BSBs by bank/branch/suburb",
  },

  {
    id: "abs-dataflows",
    path: "/au-abs/dataflows?q={query}",
    price: "0.002",
    description: "Search ABS dataflow catalogue",
  },
  {
    id: "abs-dataflow",
    path: "/au-abs/dataflow/{id}",
    price: "0.002",
    description: "ABS dataflow metadata",
  },
  {
    id: "abs-data",
    path: "/au-abs/data/{dataflow}?key={key}&startPeriod={period}",
    price: "0.005",
    description: "ABS series data (normalised)",
  },
  {
    id: "abs-cpi",
    path: "/au-abs/cpi",
    price: "0.003",
    description: "Headline CPI index + QoQ/YoY",
  },

  { id: "transit-regions", path: "/au-transit/regions", price: "0.001", description: "AU transit regions" },
  { id: "transit-vehicles", path: "/au-transit/{region}/vehicles", price: "0.003", description: "Live vehicles (GTFS-RT)" },
  { id: "transit-trips", path: "/au-transit/{region}/trip-updates", price: "0.003", description: "Trip updates / delays" },
  { id: "transit-alerts", path: "/au-transit/{region}/alerts", price: "0.002", description: "Service alerts" },
  { id: "transit-summary", path: "/au-transit/{region}/summary", price: "0.002", description: "Region feed summary" },

  { id: "energy", path: "/au-energy", price: "0.001", description: "AU energy catalogue" },
  { id: "energy-nem", path: "/au-energy/nem", price: "0.002", description: "NEM live all regions" },
  { id: "energy-nem-region", path: "/au-energy/nem/{region}", price: "0.002", description: "NEM live one region" },
  { id: "energy-notices", path: "/au-energy/notices", price: "0.002", description: "AEMO market notices" },

  { id: "rides-quote", path: "/au-rides/quote", price: "0.01", description: "Uber price estimate quote-only" },
  { id: "phone", path: "/au-phone?number={e164}", price: "0.05", description: "Phone line intel (valid/type/carrier)" },
];

export const DEMO_BASE = "https://milypay.xyz";
export const API_BASE = "https://api.milypay.xyz";
export const DOCS = "https://milypay.xyz/agents.md";
