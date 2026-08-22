/**
 * OpenAPI 3.1 document for Milypay (agent discovery).
 * Paths derived from the x402 manifest catalogue.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-static";

type Ep = {
  method: string;
  path: string;
  price: string;
  description: string;
};

// Keep in sync with src/app/api/x402-manifest/route.ts endpoints
const ENDPOINTS: Ep[] = [
  { method: "GET", path: "/au-business/abn/{abn}", price: "0.002", description: "Australian business by ABN (ABR)." },
  { method: "GET", path: "/au-business/acn/{acn}", price: "0.002", description: "Australian business by ACN (ABR)." },
  { method: "GET", path: "/au-business/search", price: "0.004", description: "ABN name search." },
  { method: "GET", path: "/au-company/acn/{acn}", price: "0.002", description: "ASIC company by ACN." },
  { method: "GET", path: "/au-company/search", price: "0.004", description: "ASIC company name search." },
  { method: "GET", path: "/au-company-report", price: "12.00", description: "Official ASIC company extract." },
  { method: "GET", path: "/au-address/validate", price: "0.004", description: "Validate Australian address (G-NAF)." },
  { method: "GET", path: "/au-address/search", price: "0.004", description: "Address autocomplete (G-NAF)." },
  { method: "GET", path: "/au-address/geocode", price: "0.004", description: "Geocode Australian address." },
  { method: "GET", path: "/au-super/abn/{abn}", price: "0.002", description: "Super fund by ABN (ATO)." },
  { method: "GET", path: "/au-weather", price: "0.001", description: "Weather for AU address or lat/lng." },
  { method: "GET", path: "/au-postage", price: "0.002", description: "Australia Post parcel rates." },
  { method: "GET", path: "/au-bsb/{bsb}", price: "0.002", description: "BSB lookup (AusPayNet)." },
  { method: "GET", path: "/au-bsb/search", price: "0.004", description: "Search BSBs." },
  { method: "GET", path: "/au-abs/dataflows", price: "0.002", description: "Search ABS dataflows." },
  { method: "GET", path: "/au-abs/dataflow/{id}", price: "0.002", description: "ABS dataflow metadata." },
  { method: "GET", path: "/au-abs/data/{dataflow}", price: "0.005", description: "ABS series observations." },
  { method: "GET", path: "/au-abs/cpi", price: "0.003", description: "Headline CPI." },
  { method: "GET", path: "/au-energy", price: "0.001", description: "Energy catalogue." },
  { method: "GET", path: "/au-energy/nem", price: "0.002", description: "NEM live all regions." },
  { method: "GET", path: "/au-energy/nem/{region}", price: "0.002", description: "NEM live one region." },
  { method: "GET", path: "/au-energy/notices", price: "0.002", description: "AEMO market notices." },
  { method: "GET", path: "/au-transit/regions", price: "0.001", description: "Transit regions." },
  { method: "GET", path: "/au-transit/{region}/vehicles", price: "0.003", description: "Live vehicles GTFS-RT." },
  { method: "GET", path: "/au-transit/{region}/trip-updates", price: "0.003", description: "Trip updates GTFS-RT." },
  { method: "GET", path: "/au-transit/{region}/alerts", price: "0.002", description: "Service alerts." },
  { method: "GET", path: "/au-transit/{region}/summary", price: "0.002", description: "Region feed summary." },
  { method: "GET", path: "/au-phone", price: "0.05", description: "Phone line intel." },
  { method: "GET", path: "/au-phone/{e164}", price: "0.05", description: "Phone line intel by path." },
  { method: "GET", path: "/au-rides", price: "0.001", description: "Rides catalogue (quote-only)." },
  { method: "GET", path: "/au-rides/quote", price: "0.01", description: "Uber price estimates." },
  { method: "GET", path: "/au-rides/eta", price: "0.01", description: "Uber pickup ETAs." },
  { method: "GET", path: "/au-rides/products", price: "0.005", description: "Uber products at point." },
  { method: "GET", path: "/domains", price: "0.001", description: "Domain catalogue." },
  { method: "GET", path: "/domains/check", price: "0.01", description: "Domain availability." },
  { method: "GET", path: "/domains/quote", price: "0.01", description: "Domain register quote." },
  { method: "POST", path: "/domains/register", price: "variable", description: "Register domain after x402." },
  { method: "GET", path: "/ramp/moneygram", price: "0", description: "MoneyGram funding status." },
  { method: "POST", path: "/ramp/moneygram/session", price: "0", description: "MoneyGram sandbox session." },
  { method: "GET", path: "/stats", price: "0", description: "Usage stats (GA4 + npm)." },
  { method: "GET", path: "/status", price: "0", description: "Service health." },
];

function pathToOpenApi(path: string): {
  pathKey: string;
  parameters: Array<Record<string, unknown>>;
} {
  const parameters: Array<Record<string, unknown>> = [];
  // strip query for path key
  const [pathOnly, query] = path.split("?");
  let pathKey = pathOnly;
  const paramRe = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = paramRe.exec(pathOnly)) !== null) {
    parameters.push({
      name: m[1],
      in: "path",
      required: true,
      schema: { type: "string" },
      description: `Path parameter ${m[1]}`,
    });
  }
  if (query) {
    for (const part of query.split("&")) {
      const [raw] = part.split("=");
      const name = raw.replace(/[{}]/g, "").replace(/^\?/, "");
      if (!name) continue;
      parameters.push({
        name,
        in: "query",
        required: false,
        schema: { type: "string" },
      });
    }
  }
  return { pathKey, parameters };
}

export function buildOpenApi() {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const ep of ENDPOINTS) {
    const { pathKey, parameters } = pathToOpenApi(ep.path);
    const method = ep.method.toLowerCase();
    if (!paths[pathKey]) paths[pathKey] = {};
    paths[pathKey][method] = {
      summary: ep.description,
      description: `${ep.description} x402 price ≈ $${ep.price} (USDC/USDT/AUD stables on Solana). Unpaid calls return HTTP 402 with PAYMENT-REQUIRED.`,
      operationId: `${method}_${pathKey.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "")}`,
      tags: ["Milypay"],
      parameters: parameters.length ? parameters : undefined,
      responses: {
        "200": {
          description: "Success (JSON)",
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        "402": {
          description: "Payment Required (x402). Pay then retry with PAYMENT-SIGNATURE.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: { type: "string", example: "payment_required" },
                  price: { type: "string" },
                  funding: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
      },
      "x-x402-price": ep.price,
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Milypay API",
      version: "1.0.0",
      summary: "Australian data for AI agents over x402",
      description:
        "Milypay is the x402 service provider for the Australian market. Pay-per-call ABR, ASIC, G-NAF, ABS, transit, energy, and more. Settled in USDC/USDT/AUD stables on Solana. No API keys. Docs: https://milypay.xyz/agents.md",
      contact: {
        name: "Milysec",
        url: "https://milysec.com",
        email: "gm@milysec.com",
      },
      license: {
        name: "Proprietary",
        url: "https://milypay.xyz",
      },
    },
    externalDocs: {
      description: "Agents guide",
      url: "https://milypay.xyz/agents.md",
    },
    servers: [
      {
        url: "https://api.milypay.xyz",
        description: "Paid API host (x402)",
      },
      {
        url: "https://milypay.xyz/api",
        description: "Demo host (free, rate-limited)",
      },
    ],
    tags: [
      {
        name: "Milypay",
        description: "Australian agent data + payments",
      },
    ],
    paths,
    components: {
      securitySchemes: {
        x402: {
          type: "apiKey",
          in: "header",
          name: "PAYMENT-SIGNATURE",
          description:
            "x402 payment proof after HTTP 402. See https://x402.org and https://milypay.xyz/.well-known/x402",
        },
      },
    },
    security: [],
    "x-milypay": {
      brand: "Milypay",
      x402Manifest: "https://milypay.xyz/.well-known/x402",
      agents: "https://milypay.xyz/agents.md",
      llms: "https://milypay.xyz/llms.txt",
      mcp: "npx milypay mcp",
      cli: "npx milypay",
      sdk: "npm i milypay-sdk",
      fund: "https://milypay.xyz/fund",
      dashboard: "https://milypay.xyz/dashboard",
    },
  };
}

export function openApiResponse() {
  return NextResponse.json(buildOpenApi(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
