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
];

export const DEMO_BASE = "https://milypay.xyz";
export const API_BASE = "https://api.milypay.xyz";
export const DOCS = "https://milypay.xyz/agents.md";
