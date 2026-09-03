/**
 * Milypay MCP server (stdio).
 * Exposes Australian data tools for Claude / Cursor / any MCP client.
 *
 * Run: npx milypay mcp
 * Env: MILYPAY_HOST=demo|api|auto (default auto)
 *      MILYPAY_PRIVATE_KEY / SOLANA_PAYER_SECRET for paid API
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getJson, postJson, type ClientOptions, type HostMode } from "./client.js";
import { DOCS, SERVICES } from "./services.js";
import { loadWallet } from "./wallet.js";

import { VERSION } from "./version.js";

function hostFromEnv(): HostMode {
  const h = (process.env.MILYPAY_HOST || "auto").toLowerCase();
  if (h === "demo" || h === "api" || h === "auto") return h;
  return "auto";
}

function opts(): ClientOptions {
  return {
    host: hostFromEnv(),
    baseUrl: process.env.MILYPAY_BASE_URL,
    rpcUrl: process.env.SOLANA_RPC_URL || process.env.HELIUS_RPC_URL,
    quiet: true,
  };
}

function digits(s: string): string {
  return s.replace(/\D/g, "");
}

function ok(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function fail(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: msg }],
  };
}

async function runJson(path: string) {
  try {
    return ok(await getJson(path, opts()));
  } catch (e) {
    return fail(e);
  }
}

export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: "milypay",
    version: VERSION,
  });

  server.registerTool(
    "list_services",
    {
      title: "List Milypay services",
      description:
        "List Australian data endpoints available on Milypay with AUD prices. Docs: " + DOCS,
      inputSchema: {},
    },
    async () =>
      ok({
        docs: DOCS,
        host: hostFromEnv(),
        services: SERVICES.map((s) => ({
          id: s.id,
          path: s.path,
          priceAUD: s.price,
          description: s.description,
        })),
      }),
  );

  server.registerTool(
    "whoami",
    {
      title: "Wallet / host status",
      description: "Show configured Solana wallet (if any) and active host mode.",
      inputSchema: {},
    },
    async () => {
      const w = loadWallet();
      return ok({
        host: hostFromEnv(),
        wallet: w ? { address: w.address, source: w.source } : null,
        hint: w
          ? "Wallet set — auto mode uses paid api.milypay.xyz"
          : "No wallet — auto mode uses free demo host milypay.xyz",
      });
    },
  );

  server.registerTool(
    "lookup_abn",
    {
      title: "Lookup ABN",
      description:
        "Australian Business Register lookup by 11-digit ABN. Returns entity name, status, type, ACN, GST, location.",
      inputSchema: {
        abn: z.string().describe("11-digit Australian Business Number"),
      },
    },
    async ({ abn }) => {
      const a = digits(abn);
      if (a.length !== 11) return fail("ABN must be 11 digits");
      return runJson(`/au-business/abn/${a}`);
    },
  );

  server.registerTool(
    "lookup_acn",
    {
      title: "Lookup business by ACN",
      description: "ABR business identity resolved from a 9-digit ACN.",
      inputSchema: {
        acn: z.string().describe("9-digit Australian Company Number"),
      },
    },
    async ({ acn }) => {
      const a = digits(acn);
      if (a.length !== 9) return fail("ACN must be 9 digits");
      return runJson(`/au-business/acn/${a}`);
    },
  );

  server.registerTool(
    "search_business",
    {
      title: "Search businesses by name",
      description: "ABN name search by business or entity name (ABR).",
      inputSchema: {
        name: z.string().describe("Business or entity name to search"),
        maxResults: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ name, maxResults }) => {
      const q = new URLSearchParams({ name });
      if (maxResults) q.set("maxResults", String(maxResults));
      return runJson(`/au-business/search?${q}`);
    },
  );

  server.registerTool(
    "lookup_company",
    {
      title: "Lookup ASIC company by ACN",
      description:
        "ASIC company register (open data): status, type, class, registration dates, former names.",
      inputSchema: {
        acn: z.string().describe("9-digit ACN"),
      },
    },
    async ({ acn }) => {
      const a = digits(acn);
      if (a.length !== 9) return fail("ACN must be 9 digits");
      return runJson(`/au-company/acn/${a}`);
    },
  );

  server.registerTool(
    "search_company",
    {
      title: "Search ASIC companies",
      description: "ASIC company name search across current and former names (open data).",
      inputSchema: {
        name: z.string().describe("Company name"),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ name, limit }) => {
      const q = new URLSearchParams({ name });
      if (limit) q.set("limit", String(limit));
      return runJson(`/au-company/search?${q}`);
    },
  );

  server.registerTool(
    "company_report",
    {
      title: "Official ASIC company extract",
      description:
        "Paid DSP ASIC extract (directors, office, share capital). ~$12 AUD on paid API. Demo host may return sandbox.",
      inputSchema: {
        acn: z.string().describe("9-digit ACN"),
      },
      annotations: { openWorldHint: true },
    },
    async ({ acn }) => {
      const a = digits(acn);
      if (a.length !== 9) return fail("ACN must be 9 digits");
      return runJson(`/au-company-report?acn=${a}`);
    },
  );

  server.registerTool(
    "address_validate",
    {
      title: "Validate Australian address",
      description: "Validate address against G-NAF. Returns canonical form, GNAF PID, geocode.",
      inputSchema: {
        q: z.string().describe("Address query, e.g. '1 bligh st sydney'"),
      },
    },
    async ({ q }) => runJson(`/au-address/validate?${new URLSearchParams({ q })}`),
  );

  server.registerTool(
    "address_search",
    {
      title: "Search / autocomplete address",
      description: "Ranked Australian address matches from G-NAF.",
      inputSchema: {
        q: z.string().describe("Partial address"),
        limit: z.number().int().min(1).max(20).optional(),
      },
    },
    async ({ q, limit }) => {
      const qs = new URLSearchParams({ q });
      if (limit) qs.set("limit", String(limit));
      return runJson(`/au-address/search?${qs}`);
    },
  );

  server.registerTool(
    "address_geocode",
    {
      title: "Geocode Australian address",
      description: "Latitude/longitude for an Australian address (G-NAF).",
      inputSchema: {
        q: z.string().describe("Address to geocode"),
      },
    },
    async ({ q }) => runJson(`/au-address/geocode?${new URLSearchParams({ q })}`),
  );

  server.registerTool(
    "lookup_super",
    {
      title: "Lookup super fund",
      description: "ATO Super Fund Lookup by ABN: fund name, status, type, USIs.",
      inputSchema: {
        abn: z.string().describe("11-digit fund ABN"),
      },
    },
    async ({ abn }) => {
      const a = digits(abn);
      if (a.length !== 11) return fail("ABN must be 11 digits");
      return runJson(`/au-super/abn/${a}`);
    },
  );

  server.registerTool(
    "weather",
    {
      title: "Australian weather",
      description:
        "Current conditions + multi-day forecast. Pass address q= or lat+lng. BOM ACCESS-G via Open-Meteo.",
      inputSchema: {
        q: z.string().optional().describe("Australian address"),
        lat: z.number().optional(),
        lng: z.number().optional(),
        days: z.number().int().min(1).max(14).optional(),
      },
    },
    async ({ q, lat, lng, days }) => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (lat != null) qs.set("lat", String(lat));
      if (lng != null) qs.set("lng", String(lng));
      if (days != null) qs.set("days", String(days));
      if (!qs.has("q") && !(qs.has("lat") && qs.has("lng"))) {
        return fail("Provide q (address) or lat+lng");
      }
      return runJson(`/au-weather?${qs}`);
    },
  );

  server.registerTool(
    "lookup_bsb",
    {
      title: "Lookup BSB",
      description:
        "AusPayNet BSB directory: bank, branch, address, payment methods. Accept 012-002 or 012002.",
      inputSchema: {
        bsb: z.string().describe("BSB with or without hyphen"),
      },
    },
    async ({ bsb }) => {
      const d = digits(bsb);
      if (d.length !== 6) return fail("BSB must be 6 digits");
      const formatted = `${d.slice(0, 3)}-${d.slice(3)}`;
      return runJson(`/au-bsb/${encodeURIComponent(formatted)}`);
    },
  );

  server.registerTool(
    "search_bsb",
    {
      title: "Search BSBs",
      description: "Search BSBs by bank name, branch, or suburb.",
      inputSchema: {
        q: z.string().describe("Search query"),
        limit: z.number().int().min(1).max(20).optional(),
      },
    },
    async ({ q, limit }) => {
      const qs = new URLSearchParams({ q });
      if (limit) qs.set("limit", String(limit));
      return runJson(`/au-bsb/search?${qs}`);
    },
  );

  server.registerTool(
    "postage",
    {
      title: "Australia Post rates",
      description:
        "Domestic parcel rates (--from/--to/--weight + dimensions) or international (--country/--weight).",
      inputSchema: {
        from: z.string().optional().describe("From postcode (domestic)"),
        to: z.string().optional().describe("To postcode (domestic)"),
        country: z.string().optional().describe("ISO country code (international)"),
        weight: z.number().positive().describe("Weight in kg"),
        length: z.number().positive().optional().describe("cm (domestic)"),
        width: z.number().positive().optional().describe("cm (domestic)"),
        height: z.number().positive().optional().describe("cm (domestic)"),
      },
    },
    async (args) => {
      const qs = new URLSearchParams();
      qs.set("weight", String(args.weight));
      if (args.country) qs.set("country", args.country);
      if (args.from) qs.set("from", args.from);
      if (args.to) qs.set("to", args.to);
      if (args.length != null) qs.set("length", String(args.length));
      if (args.width != null) qs.set("width", String(args.width));
      if (args.height != null) qs.set("height", String(args.height));
      if (!args.country && !(args.from && args.to)) {
        return fail("Need from+to (domestic) or country (international)");
      }
      return runJson(`/au-postage?${qs}`);
    },
  );

  server.registerTool(
    "call",
    {
      title: "Raw API call",
      description:
        "GET an arbitrary Milypay path, e.g. /au-business/abn/51824753556. Prefer typed tools when possible.",
      inputSchema: {
        path: z
          .string()
          .describe("API path starting with /, e.g. /au-bsb/012-002"),
      },
    },
    async ({ path }) => {
      const p = path.startsWith("/") ? path : `/${path}`;
      return runJson(p);
    },
  );

  // Resource: agents guide
  server.registerResource(
    "agents-guide",
    "milypay://agents.md",
    {
      title: "Milypay agents guide",
      description: "Agent-facing documentation URL and service summary",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "milypay://agents.md",
          mimeType: "text/markdown",
          text: [
            `# Milypay MCP`,
            ``,
            `Full guide: ${DOCS}`,
            `Host mode: ${hostFromEnv()} (env MILYPAY_HOST)`,
            ``,
            `## Services`,
            ...SERVICES.map((s) => `- ${s.id} — ${s.path} — $${s.price} AUD — ${s.description}`),
          ].join("\n"),
        },
      ],
    }),
  );


  server.registerTool(
    "abs_dataflows",
    {
      description: "Search or list ABS (Australian Bureau of Statistics) SDMX dataflows — CPI, wages, population, census, retail, etc.",
      inputSchema: {
        q: z.string().optional().describe("Search query e.g. CPI, wage, population"),
        limit: z.number().int().min(1).max(200).optional(),
      },
    },
    async ({ q, limit }) => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (limit) qs.set("limit", String(limit));
      const path = `/au-abs/dataflows${qs.toString() ? `?${qs}` : ""}`;
      return runJson(path);
    },
  );

  server.registerTool(
    "abs_dataflow",
    {
      description: "ABS dataflow structure/metadata by id (e.g. CPI, WPI, RT).",
      inputSchema: { id: z.string().describe("Dataflow id e.g. CPI") },
    },
    async ({ id }) => runJson(`/au-abs/dataflow/${encodeURIComponent(id)}`),
  );

  server.registerTool(
    "abs_data",
    {
      description: "Fetch ABS statistical series (normalised observations). Prefer a series key + startPeriod.",
      inputSchema: {
        dataflow: z.string().describe("e.g. CPI"),
        key: z.string().optional().describe("SDMX key e.g. 1.10001.10.50.Q"),
        startPeriod: z.string().optional().describe("e.g. 2020 or 2020-Q1"),
        endPeriod: z.string().optional(),
      },
    },
    async ({ dataflow, key, startPeriod, endPeriod }) => {
      const qs = new URLSearchParams();
      if (key) qs.set("key", key);
      if (startPeriod) qs.set("startPeriod", startPeriod);
      if (endPeriod) qs.set("endPeriod", endPeriod);
      if (!key && !startPeriod) qs.set("startPeriod", "2020");
      const q = qs.toString();
      return runJson(`/au-abs/data/${encodeURIComponent(dataflow)}${q ? `?${q}` : ""}`);
    },
  );

  server.registerTool(
    "abs_cpi",
    {
      description: "Headline Australian CPI (All groups, quarterly index) with latest value, QoQ and YoY % change. ABS cat. 6401.0.",
      inputSchema: {
        startPeriod: z.string().optional().describe("e.g. 2015"),
      },
    },
    async ({ startPeriod }) => {
      const qs = startPeriod ? `?startPeriod=${encodeURIComponent(startPeriod)}` : "";
      return runJson(`/au-abs/cpi${qs}`);
    },
  );



  server.registerTool(
    "transit_regions",
    {
      description: "List Australian public transport regions available on Milypay (live GTFS-RT + planned).",
      inputSchema: {},
    },
    async () => runJson("/au-transit/regions"),
  );

  server.registerTool(
    "transit_vehicles",
    {
      description: "Live public transport vehicle positions (GTFS-RT). region=seq (QLD Translink) or sa (Adelaide).",
      inputSchema: {
        region: z.string().describe("seq or sa"),
        routeId: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      },
    },
    async ({ region, routeId, limit }) => {
      const qs = new URLSearchParams();
      if (routeId) qs.set("routeId", routeId);
      if (limit) qs.set("limit", String(limit));
      const q = qs.toString();
      return runJson(`/au-transit/${encodeURIComponent(region)}/vehicles${q ? `?${q}` : ""}`);
    },
  );

  server.registerTool(
    "transit_trip_updates",
    {
      description: "Live trip delays and stop ETAs (GTFS-RT).",
      inputSchema: {
        region: z.string().describe("seq or sa"),
        routeId: z.string().optional(),
        stopId: z.string().optional(),
        limit: z.number().int().min(1).max(150).optional(),
      },
    },
    async ({ region, routeId, stopId, limit }) => {
      const qs = new URLSearchParams();
      if (routeId) qs.set("routeId", routeId);
      if (stopId) qs.set("stopId", stopId);
      if (limit) qs.set("limit", String(limit));
      const q = qs.toString();
      return runJson(`/au-transit/${encodeURIComponent(region)}/trip-updates${q ? `?${q}` : ""}`);
    },
  );

  server.registerTool(
    "transit_alerts",
    {
      description: "Public transport service alerts (GTFS-RT).",
      inputSchema: {
        region: z.string().describe("seq or sa"),
        routeId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ region, routeId, limit }) => {
      const qs = new URLSearchParams();
      if (routeId) qs.set("routeId", routeId);
      if (limit) qs.set("limit", String(limit));
      const q = qs.toString();
      return runJson(`/au-transit/${encodeURIComponent(region)}/alerts${q ? `?${q}` : ""}`);
    },
  );

  server.registerTool(
    "transit_summary",
    {
      description: "Summary counts of vehicles, trip updates, and alerts for a transit region.",
      inputSchema: { region: z.string().describe("seq or sa") },
    },
    async ({ region }) => runJson(`/au-transit/${encodeURIComponent(region)}/summary`),
  );



  server.registerTool(
    "energy_nem",
    {
      description: "Live Australian NEM wholesale electricity price and demand for all regions (AEMO). Returns $/MWh spot, demand MW, generation, interconnectors.",
      inputSchema: {},
    },
    async () => runJson("/au-energy/nem"),
  );

  server.registerTool(
    "energy_nem_region",
    {
      description: "Live NEM snapshot for one region. region=NSW1|QLD1|SA1|TAS1|VIC1 (or NSW/QLD/SA/TAS/VIC).",
      inputSchema: { region: z.string().describe("NSW1, VIC1, QLD1, SA1, TAS1") },
    },
    async ({ region }) => runJson(`/au-energy/nem/${encodeURIComponent(region)}`),
  );

  server.registerTool(
    "energy_notices",
    {
      description: "Recent AEMO National Electricity Market notices (non-conformance, outages, etc).",
      inputSchema: { limit: z.number().int().min(1).max(50).optional() },
    },
    async ({ limit }) => {
      const q = limit ? `?limit=${limit}` : "";
      return runJson(`/au-energy/notices${q}`);
    },
  );



  server.registerTool(
      "lookup_phone",
      {
        description: "Phone line intelligence (Twilio): valid, country, line type (mobile/landline/voip), carrier. NOT personal identity or caller name. Accepts E.164 (+61…) or AU 04…",
        inputSchema: {
          number: z.string().describe("E.164 phone e.g. +614****5678 or AU mobile 0412345678"),
        },
      },
      async ({ number }) => runJson(`/au-phone?number=${encodeURIComponent(number)}`),
    );

    server.registerTool(
      "domains_check",
    {
      description: "Check DNS domain availability via Dynadot (x402 catalogue).",
      inputSchema: { name: z.string() },
    },
    async ({ name }: { name: string }) => runJson(`/domains/check?name=${encodeURIComponent(name)}`),
  );

  server.registerTool(
    "domains_quote",
    {
      description: "Quote domain registration chargeUsd for x402.",
      inputSchema: { name: z.string(), years: z.number().optional() },
    },
    async ({ name, years }: { name: string; years?: number }) =>
      runJson(`/domains/quote?name=${encodeURIComponent(name)}&years=${years || 1}`),
  );

  server.registerTool(
    "rides_quote",
      {
        description:
          "Uber ride PRICE estimates only (no booking). start/end lat/lng. Returns product prices and surge.",
        inputSchema: {
          start_lat: z.number(),
          start_lng: z.number(),
          end_lat: z.number(),
          end_lng: z.number(),
          seat_count: z.number().int().min(1).max(10).optional(),
        },
      },
      async ({ start_lat, start_lng, end_lat, end_lng, seat_count }) => {
        const qs = new URLSearchParams({
          start_lat: String(start_lat),
          start_lng: String(start_lng),
          end_lat: String(end_lat),
          end_lng: String(end_lng),
        });
        if (seat_count) qs.set("seat_count", String(seat_count));
        return runJson(`/au-rides/quote?${qs}`);
      },
    );

    server.registerTool(
      "rides_eta",
      {
        description: "Uber pickup ETA estimates only (no booking).",
        inputSchema: {
          start_lat: z.number(),
          start_lng: z.number(),
          product_id: z.string().optional(),
        },
      },
      async ({ start_lat, start_lng, product_id }) => {
        const qs = new URLSearchParams({
          start_lat: String(start_lat),
          start_lng: String(start_lng),
        });
        if (product_id) qs.set("product_id", product_id);
        return runJson(`/au-rides/eta?${qs}`);
      },
    );

    server.registerTool(
      "rides_products",
      {
        description: "Uber products available at a lat/lng (no booking).",
        inputSchema: { lat: z.number(), lng: z.number() },
      },
      async ({ lat, lng }) =>
        runJson(`/au-rides/products?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`),
    );

  server.registerTool(
    "check_postcode",
    {
      description: "Suburbs in an AU/NZ postcode (Checkify).",
      inputSchema: { postcode: z.string(), country: z.string().optional() },
    },
    async ({ postcode, country }) => {
      const qs = new URLSearchParams({ postcode });
      if (country) qs.set("country", country);
      return runJson(`/au-check/postcode?${qs}`);
    },
  );

  server.registerTool(
    "check_company_name",
    {
      description: "ASIC company name availability.",
      inputSchema: { name: z.string() },
    },
    async ({ name }) => runJson(`/au-check/company-name?name=${encodeURIComponent(name)}`),
  );

  server.registerTool(
    "check_sanctions",
    {
      description: "Sanctions screening against 11 lists. Optional birth_year, country, city.",
      inputSchema: {
        name: z.string(),
        birth_year: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
      },
    },
    async ({ name, birth_year, country, city }) => {
      const qs = new URLSearchParams({ name });
      if (birth_year) qs.set("birth_year", birth_year);
      if (country) qs.set("country", country);
      if (city) qs.set("city", city);
      return runJson(`/au-check/sanctions?${qs}`);
    },
  );

  server.registerTool(
    "check_email",
    {
      description: "Email format/MX/deliverability (Checkify).",
      inputSchema: { email: z.string() },
    },
    async ({ email }) => runJson(`/au-check/email?email=${encodeURIComponent(email)}`),
  );

  server.registerTool(
    "moneygram_status",
    {
      description:
        "MoneyGram funding status for pre-x402 wallet top-up. MoneyGram does NOT settle x402 — it funds USDC so you can pay. Demo UI: https://milypay.xyz/fund",
      inputSchema: {},
    },
    async () => runJson(`/ramp/moneygram`),
  );

  server.registerTool(
    "moneygram_session",
    {
      description:
        "Create a MoneyGram Ramps sandbox session. Returns widgetUrl + sessionToken. Open widget to on-ramp USDC into a Solana wallet, then retry paid x402 calls. mode=on-ramp (fund) or off-ramp (cash out).",
      inputSchema: {
        mode: z
          .enum(["on-ramp", "off-ramp"])
          .optional()
          .describe("on-ramp (default) funds wallet; off-ramp cashes out"),
      },
    },
    async ({ mode }) => {
      try {
        return ok(
          await postJson(
            `/ramp/moneygram/session`,
            { mode: mode || "on-ramp" },
            opts(),
          ),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

    const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep process alive — transport owns stdio
}
