import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import CodeBlock from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Docs | Milypay",
  description:
    "Milypay API documentation: Australian business, company, address, super fund, weather, BSB, ABS statistics, and x402 (AUDD) payment details.",
  alternates: { canonical: "/docs" },
};

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "payments", label: "Payments (x402)" },
  { id: "business", label: "Business identity" },
  { id: "company", label: "Company register" },
  { id: "company-report", label: "ASIC extract" },
  { id: "address", label: "Address" },
  { id: "super", label: "Super funds" },
  { id: "weather", label: "Weather" },
  { id: "postage", label: "Postage" },
  { id: "abs", label: "ABS statistics" },
  { id: "transit", label: "Public transport" },
  { id: "energy", label: "Energy (NEM)" },
  { id: "markets", label: "Market data" },
  { id: "data", label: "Data & attribution" },
];

type Endpoint = { path: string; desc: string; example: string; response: string };
type Section = { id: string; title: string; namespace: string; source: string; blurb: string; endpoints: Endpoint[] };

const SECTIONS: Section[] = [
  {
    id: "business",
    title: "Business identity",
    namespace: "milysec/au-business",
    source: "Australian Business Register (ATO)",
    blurb: "Look up Australian businesses by ABN, ACN, or name.",
    endpoints: [
      {
        path: "GET /au-business/abn/{abn}",
        desc: "Entity name, status, type, ACN, GST, business names, and location for an 11-digit ABN.",
        example: "curl https://api.milypay.xyz/au-business/abn/33051775556",
        response: `{
  "abn": "33051775556",
  "abnStatus": "Active",
  "acn": "051775556",
  "entityName": "TELSTRA CORPORATION LIMITED",
  "entityType": "Australian Public Company",
  "businessNames": ["YELLOW PAGES", "WHEREIS", "..."],
  "gstRegistered": true,
  "state": "VIC",
  "postcode": "3000"
}`,
      },
      {
        path: "GET /au-business/acn/{acn}",
        desc: "Same entity record, resolved from a 9-digit ACN.",
        example: "curl https://api.milypay.xyz/au-business/acn/051775556",
        response: `{ "abn": "33051775556", "entityName": "TELSTRA CORPORATION LIMITED", "...": "..." }`,
      },
      {
        path: "GET /au-business/search?name={name}",
        desc: "Matching ABNs for a business or entity name. Optional maxResults (default 10).",
        example: 'curl "https://api.milypay.xyz/au-business/search?name=woolworths"',
        response: `{
  "matches": [
    { "abn": "88000014675", "name": "WOOLWORTHS", "nameType": "Business Name",
      "abnStatus": "Active", "state": "NSW", "postcode": "2153", "score": 99 }
  ]
}`,
      },
    ],
  },
  {
    id: "company",
    title: "Company register",
    namespace: "milysec/au-company",
    source: "ASIC Company Register (data.gov.au)",
    blurb: "ASIC company records: status, type, class, registration dates, and former names.",
    endpoints: [
      {
        path: "GET /au-company/acn/{acn}",
        desc: "Company details for an ACN, including former names.",
        example: "curl https://api.milypay.xyz/au-company/acn/000014675",
        response: `{
  "acn": "000014675",
  "abn": "88000014675",
  "name": "Woolworths Group Limited",
  "status": "Registered",
  "type": "Australian public company",
  "class": "Limited by shares",
  "registrationDate": "1924-09-22",
  "deregistrationDate": null,
  "formerNames": ["Woolworths Ltd"]
}`,
      },
      {
        path: "GET /au-company/search?name={name}",
        desc: "Companies matching a name, across current and former names (ASIC open data).",
        example: 'curl "https://api.milypay.xyz/au-company/search?name=commonwealth bank"',
        response: `{
  "matches": [
    { "acn": "123123124", "name": "Commonwealth Bank Of Australia",
      "status": "Registered", "formerName": false }
  ]
}`,
      },
    ],
  },
  {
    id: "company-report",
    title: "ASIC company extract",
    namespace: "milysec/au-company-report",
    source: "ASIC via Business API (DSP)",
    blurb:
      "Official company extract PDF (directors, officeholders, share capital, registered office). Free gov open data does not include officeholders — this is the paid DSP product. Demo host = Business API sandbox (free, watermarked). api.milypay.xyz = live extract, always $12 via x402.",
    endpoints: [
      {
        path: "GET /au-company-report?acn={acn}&type=current|historical",
        desc: "Order an ASIC company extract by ACN. Returns JSON metadata + pdfBase64. Live host always charged $12; website demos use sandbox.",
        example: 'curl "https://api.milypay.xyz/au-company-report?acn=000014675&type=current"',
        response: `{
  "acn": "000014675",
  "type": "current",
  "requestId": 30679,
  "status": "finished",
  "environment": "live",
  "demo": false,
  "pdfBase64": "JVBERi0xLjcK...",
  "pdfBytes": 48210,
  "attribution": "Source: ASIC company extract ordered via Business API (DSP)"
}`,
      },
      {
        path: "POST /au-company-report",
        desc: "Same as GET with JSON body { \"acn\": \"000014675\", \"type\": \"current\" }.",
        example:
          `curl -X POST https://api.milypay.xyz/au-company-report -H 'content-type: application/json' -d '{"acn":"000014675","type":"current"}'`,
        response: `{ "acn": "000014675", "status": "finished", "pdfBase64": "..." }`,
      },
    ],
  },
  {
    id: "address",
    title: "Address",
    namespace: "milysec/au-address",
    source: "G-NAF (Geoscape Australia)",
    blurb: "Validate, search, and geocode any Australian address from the 16.9M-record G-NAF.",
    endpoints: [
      {
        path: "GET /au-address/validate?q={address}",
        desc: "Best canonical match for a freeform address, with GNAF PID and geocode.",
        example: 'curl "https://api.milypay.xyz/au-address/validate?q=1 bligh st sydney"',
        response: `{
  "valid": true,
  "match": {
    "address": "1 Bligh Street, Sydney NSW 2000",
    "gnafPid": "GANSW717886958",
    "locality": "Sydney", "state": "NSW", "postcode": "2000",
    "lat": -33.86486428, "lng": 151.2105094
  }
}`,
      },
      {
        path: "GET /au-address/search?q={address}",
        desc: "Ranked address matches for autocomplete. Optional limit (default 8).",
        example: 'curl "https://api.milypay.xyz/au-address/search?q=120 collins st melbourne"',
        response: `{ "count": 1, "results": [ { "address": "120 Collins Street, Melbourne VIC 3000", "...": "..." } ] }`,
      },
      {
        path: "GET /au-address/geocode?q={address}",
        desc: "Latitude and longitude for the best-matching address.",
        example: 'curl "https://api.milypay.xyz/au-address/geocode?q=200 adelaide st brisbane"',
        response: `{ "found": true, "lat": -27.46831, "lng": 153.02356,
  "address": "200 Adelaide Street, Brisbane City QLD 4000", "gnafPid": "GAQLD..." }`,
      },
    ],
  },
  {
    id: "super",
    title: "Super funds",
    namespace: "milysec/au-super",
    source: "Super Fund Lookup (ATO)",
    blurb: "Verify any Australian superannuation fund by ABN.",
    endpoints: [
      {
        path: "GET /au-super/abn/{abn}",
        desc: "Fund name, status, type, complying status, and USIs/products.",
        example: "curl https://api.milypay.xyz/au-super/abn/65714394898",
        response: `{
  "abn": "65714394898",
  "abnStatus": "Active",
  "fundName": "The Trustee for AUSTRALIANSUPER",
  "fundType": "APRA Regulated Public Offer Fund",
  "complyingStatus": "APRA Registered",
  "state": "VIC", "postcode": "3000",
  "products": [ { "usi": "STA0100AU", "productName": "AustralianSuper", "contributionsRestricted": false } ]
}`,
      },
    ],
  },
  {
    id: "weather",
    title: "Weather",
    namespace: "milysec/au-weather",
    source: "Open-Meteo (BOM ACCESS-G)",
    blurb: "Current conditions and forecast for any Australian address or coordinate.",
    endpoints: [
      {
        path: "GET /au-weather?q={address}  ·  ?lat={lat}&lng={lng}",
        desc: "Geocodes the address (via G-NAF) then returns current conditions and a daily forecast. Optional days (default 7).",
        example: 'curl "https://api.milypay.xyz/au-weather?q=120 collins st melbourne&days=3"',
        response: `{
  "location": { "address": "120 Collins Street, Melbourne VIC 3000", "lat": -37.81, "lng": 144.97 },
  "current": { "temperature": 15.4, "apparentTemperature": 13.9, "humidity": 78,
    "windSpeed": 15, "weather": "Mainly clear" },
  "daily": [ { "date": "2026-06-02", "tempMax": 16, "tempMin": 11, "weather": "Drizzle" } ]
}`,
      },
    ],
  },
  {
    id: "postage",
    title: "Postage",
    namespace: "milysec/au-postage",
    source: "Australia Post (Postage Assessment Calculator)",
    blurb: "Australia Post parcel rates and service options between postcodes, domestic or international.",
    endpoints: [
      {
        path: "GET /au-postage?from={pc}&to={pc}&weight={kg}",
        desc: "Domestic parcel services and prices. Optional length/width/height in cm.",
        example: 'curl "https://api.milypay.xyz/au-postage?from=3000&to=2000&weight=2"',
        response: `{
  "from": "3000", "to": "2000",
  "services": [
    { "code": "AUS_PARCEL_REGULAR", "name": "Parcel Post", "price": 19.30 },
    { "code": "AUS_PARCEL_EXPRESS", "name": "Express Post", "price": 23.80 }
  ]
}`,
      },
      {
        path: "GET /au-postage?country={cc}&weight={kg}",
        desc: "International parcel services for a 2-letter country code.",
        example: 'curl "https://api.milypay.xyz/au-postage?country=US&weight=1"',
        response: `{ "country": "US", "services": [ { "code": "...", "name": "...", "price": 0 } ] }`,
      },
    ],
  },
  {
    id: "abs",
    title: "ABS statistics",
    namespace: "milysec/au-abs",
    source: "Australian Bureau of Statistics (Data API / SDMX)",
    blurb:
      "Official ABS statistics via the SDMX Data API — 1,200+ dataflows including CPI, wages, population, census, and retail. No upstream API key. Attribution: ABS CC BY 4.0.",
    endpoints: [
      {
        path: "GET /au-abs/dataflows?q={query}",
        desc: "Search or list ABS SDMX dataflows. Optional limit (default 50).",
        example: 'curl "https://api.milypay.xyz/au-abs/dataflows?q=CPI&limit=5"',
        response: `{
  "count": 4, "total": 4,
  "dataflows": [
    { "id": "CPI", "name": "Consumer Price Index (CPI)", "agency": "ABS", "version": "2.0.0" }
  ]
}`,
      },
      {
        path: "GET /au-abs/dataflow/{id}",
        desc: "Dataflow structure and metadata for an id such as CPI, WPI, or RT.",
        example: "curl https://api.milypay.xyz/au-abs/dataflow/CPI",
        response: `{ "dataflow": "CPI", "agency": "ABS", "raw": { "...": "SDMX structure" } }`,
      },
      {
        path: "GET /au-abs/data/{dataflow}?key={key}&startPeriod={period}",
        desc: "Fetch series observations, normalised to JSON. Prefer a series key and startPeriod.",
        example:
          'curl "https://api.milypay.xyz/au-abs/data/CPI?key=1.10001.10.50.Q&startPeriod=2020"',
        response: `{
  "dataflow": "CPI", "name": "Consumer Price Index (CPI)", "seriesCount": 1,
  "series": [{
    "key": "0:0:0:0:0",
    "observations": [{ "period": "2026-Q2", "value": 102.31 }]
  }]
}`,
      },
      {
        path: "GET /au-abs/cpi?startPeriod={period}",
        desc: "Headline All groups CPI (Australia, quarterly) with latest index, QoQ and YoY % change. Catalogue 6401.0.",
        example: 'curl "https://api.milypay.xyz/au-abs/cpi?startPeriod=2015"',
        response: `{
  "indicator": "CPI",
  "latest": { "period": "2026-Q2", "value": 102.31 },
  "changeQoQPercent": 0.6,
  "changeYoYPercent": 3.94
}`,
      },
    ],
  },

  {
    id: "transit",
    title: "Public transport",
    namespace: "milysec/au-transit",
    source: "GTFS-Realtime (Translink SEQ, Adelaide Metro)",
    blurb:
      "Live vehicles, trip delays/ETAs, and service alerts (GTFS-RT). Regions: `seq` (QLD Translink), `sa` (Adelaide Metro), `vic` (metro/tram/bus/vline), `nsw` (buses/sydneytrains/metro/nswtrains/ferries/lightrail).",
    endpoints: [
      {
        path: "GET /au-transit/regions",
        desc: "Live and planned Australian transit regions.",
        example: "curl https://api.milypay.xyz/au-transit/regions",
        response: `{ "live": [{ "id": "seq", "name": "South East Queensland", "operator": "Translink" }] }`,
      },
      {
        path: "GET /au-transit/{region}/vehicles?limit=&routeId=",
        desc: "Live vehicle positions. region=seq|sa.",
        example: 'curl "https://api.milypay.xyz/au-transit/seq/vehicles?limit=10"',
        response: `{ "count": 10, "vehicles": [{ "routeId": "589-4838", "lat": -27.72, "lon": 153.08 }] }`,
      },
      {
        path: "GET /au-transit/{region}/trip-updates",
        desc: "Delays and stop ETAs for active trips.",
        example: 'curl "https://api.milypay.xyz/au-transit/sa/trip-updates?limit=10"',
        response: `{ "tripUpdates": [{ "routeId": "...", "stopTimeUpdates": [{ "arrivalDelaySec": 120 }] }] }`,
      },
      {
        path: "GET /au-transit/{region}/alerts",
        desc: "Service alerts and disruptions.",
        example: "curl https://api.milypay.xyz/au-transit/seq/alerts",
        response: `{ "alerts": [{ "header": "...", "description": "..." }] }`,
      },
      {
        path: "GET /au-transit/{region}/summary",
        desc: "Counts of vehicles, trip updates, and alerts plus a sample.",
        example: "curl https://api.milypay.xyz/au-transit/seq/summary",
        response: `{ "vehicles": 1455, "tripUpdates": 800, "alerts": 12 }`,
      },
    ],
  },


  {
    id: "energy",
    title: "Energy (NEM)",
    namespace: "milysec/au-energy",
    source: "AEMO NEM ELEC_NEM_SUMMARY (no API key)",
    blurb:
      "Live National Electricity Market wholesale spot prices ($/MWh), demand, generation, FCAS and interconnectors for NSW1, QLD1, SA1, TAS1, VIC1. Not retail tariffs. Gas and water planned.",
    endpoints: [
      {
        path: "GET /au-energy",
        desc: "Energy products catalogue.",
        example: "curl https://api.milypay.xyz/au-energy",
        response: `{ "products": [{ "id": "nem", "regions": ["NSW1","VIC1"] }] }`,
      },
      {
        path: "GET /au-energy/nem",
        desc: "All NEM regions live snapshot.",
        example: "curl https://api.milypay.xyz/au-energy/nem",
        response: `{ "regions": [{ "regionId": "NSW1", "priceAudPerMwh": 50.84, "totalDemandMw": 10113 }] }`,
      },
      {
        path: "GET /au-energy/nem/{region}",
        desc: "One region. Accepts NSW1 or NSW, VIC1 or VIC, etc.",
        example: 'curl "https://api.milypay.xyz/au-energy/nem/VIC"',
        response: `{ "regionId": "VIC1", "priceAudPerMwh": 141.37, "fcas": { "raiseReg": 0.42 } }`,
      },
      {
        path: "GET /au-energy/notices",
        desc: "Recent AEMO market notices.",
        example: "curl https://api.milypay.xyz/au-energy/notices",
        response: `{ "notices": [{ "type": "NON-CONFORMANCE", "reference": "..." }] }`,
      },
    ],
  },

  {
    id: "markets",
    title: "Market data (third-party)",
    namespace: "milysec/markets",
    source: "Birdeye (birdeye/data on pay.sh), resold by Milypay",
    blurb:
      "Solana and multi-chain DeFi data - token prices, overviews, security, holders, trending. You pay Milypay in AUDD; Milypay pays Birdeye in USDC. Paid-only (no free tier, since each call costs us upstream). Path maps to Birdeye's /x402/* endpoints (47 available).",
    endpoints: [
      {
        path: "GET /markets/defi/price?address={mint}&chain=solana",
        desc: "Real-time token price.",
        example:
          'curl "https://api.milypay.xyz/markets/defi/price?address=So11111111111111111111111111111111111111112&chain=solana"',
        response: `{ "success": true, "data": { "value": 67.94, "priceChange24h": -5.98, "updateUnixTime": 1780611789 } }`,
      },
      {
        path: "GET /markets/defi/token_overview?address={mint}&chain=solana",
        desc: "Full token snapshot: price, volume, liquidity, market cap, metadata.",
        example:
          'curl "https://api.milypay.xyz/markets/defi/token_overview?address=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263&chain=solana"',
        response: `{ "data": { "name": "Bonk", "price": 0.0000047, "liquidity": 2397911, "marketCap": 391882289 } }`,
      },
      {
        path: "GET /markets/defi/token_security?address={mint}&chain=solana",
        desc: "Security and rug-risk indicators for a token.",
        example: 'curl "https://api.milypay.xyz/markets/defi/token_security?address={mint}&chain=solana"',
        response: `{ "data": { "...": "security analysis" } }`,
      },
    ],
  },
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display scroll-mt-24 text-2xl tracking-tight md:text-3xl">
      {children}
    </h2>
  );
}

export default function DocsPage() {
  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-6 py-12 md:grid md:grid-cols-[180px_1fr] md:gap-12">
        {/* sidebar */}
        <aside className="mb-10 md:mb-0">
          <nav className="md:sticky md:top-24 flex flex-wrap gap-x-4 gap-y-2 text-sm md:flex-col md:gap-2">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="text-muted transition hover:text-fg">
                {n.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* content */}
        <div className="min-w-0 space-y-16">
          <section className="space-y-4">
            <p className="section-label">Documentation</p>
            <H id="overview">Milypay API</H>
            <p className="leading-relaxed text-muted">
              Pay-per-call Australian data for AI agents, settled in AUD stablecoins on the x402
              rail. Business identity, company register, address, super funds, weather, postage,
              BSB, ABS statistics, and public transport. Responses are JSON. No API keys.
            </p>
            <div className="card p-5 text-sm">
              <p>
                <span className="text-muted">Base URL</span>{" "}
                <code className="text-fg">https://api.milypay.xyz</code>
              </p>
              <p className="mt-2">
                <span className="text-muted">Catalog</span>{" "}
                <a href="https://pay.sh" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">pay.sh</a>{" "}
                <span className="text-muted">· namespace</span> <code className="text-fg">milysec/*</code>
              </p>
              <p className="mt-2 text-muted">
                Agent guide: <Link href="/agents.md" className="text-brand-green hover:underline">/agents.md</Link>{" "}
                · Try it: <Link href="/demo" className="text-brand-green hover:underline">/demo</Link>
              </p>
            </div>
          </section>

          {/* Payments */}
          <section className="space-y-4">
            <H id="payments">Payments (x402)</H>
            <p className="leading-relaxed text-muted">
              The API host charges per call over the{" "}
              <a href="https://x402.org" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">x402</a>{" "}
              protocol, settled in <span className="text-fg">AUDD</span> on Solana via the PayAI
              facilitator. An unpaid request returns <code className="text-fg">402</code> with a
              base64 <code className="text-fg">PAYMENT-REQUIRED</code> challenge (price, asset,
              network, pay-to). An x402-aware client pays and retries with a{" "}
              <code className="text-fg">PAYMENT-SIGNATURE</code> header; the data returns in the
              same round-trip.
            </p>
            <p className="leading-relaxed text-muted">
              The same endpoints on the website host{" "}
              <code className="text-fg">https://milypay.xyz/api/...</code> and the{" "}
              <Link href="/demo" className="text-brand-green hover:underline">live demo</Link> are
              free and per-IP rate limited, so you can try every service without paying. To run
              the real paid round-trip with a Solana wallet, see{" "}
              <Link href="/pay" className="text-brand-green hover:underline">/pay</Link>.
            </p>
            <CodeBlock
              code={`# Paid (agents): returns 402, then pay + retry
curl https://api.milypay.xyz/au-business/abn/33051775556

# Free (try it): same data, no payment
curl https://milypay.xyz/api/au-business/abn/33051775556`}
            />
          </section>

          {/* Services */}
          {SECTIONS.map((s) => (
            <section key={s.id} className="space-y-5">
              <div className="space-y-2">
                <H id={s.id}>{s.title}</H>
                <p className="text-sm">
                  <code className="text-brand-purple">{s.namespace}</code>
                  <span className="text-muted"> · {s.source}</span>
                </p>
                <p className="leading-relaxed text-muted">{s.blurb}</p>
              </div>
              {s.endpoints.map((e) => (
                <div key={e.path} className="card p-5 md:p-6">
                  <code className="text-sm text-brand-green">{e.path}</code>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{e.desc}</p>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-xs uppercase tracking-widest text-muted">Request</p>
                      <CodeBlock code={e.example} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs uppercase tracking-widest text-muted">Response</p>
                      <CodeBlock code={e.response} />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}

          {/* Data & attribution */}
          <section className="space-y-4">
            <H id="data">Data & attribution</H>
            <ul className="space-y-2 text-sm leading-relaxed text-muted">
              <li>Business and super: Australian Business Register and Super Fund Lookup, Australian Taxation Office.</li>
              <li>
                Company: ASIC Company Register, published open on data.gov.au. Official search:{" "}
                <a
                  href="https://connectonline.asic.gov.au/RegistrySearch/faces/landing/SearchRegisters.jspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-green hover:underline"
                >
                  ASIC company search
                </a>
                {" "}
                (
                <a
                  href="https://www.asic.gov.au/online-services/search-asic-registers/company-and-organisation-registers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  about the registers
                </a>
                ). Official company extracts (directors / officeholders) are ordered via{" "}
                <a
                  href="https://businessapi.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-green hover:underline"
                >
                  Business API
                </a>{" "}
                DSP at <code className="text-fg">/au-company-report</code> ($12 live).
              </li>
              <li>Address: Incorporates G-NAF &copy; Geoscape Australia, open G-NAF licence. Per-call lookups only.</li>
              <li>Weather: Open-Meteo.com (CC BY 4.0), Australian model BOM ACCESS-G.</li>
              <li>
                Statistics: Australian Bureau of Statistics Data API (SDMX),{" "}
                <a
                  href="https://www.abs.gov.au/statistics/application-programming-interfaces-apis/data-api-user-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-green hover:underline"
                >
                  ABS Data API
                </a>
                . Licensed under Creative Commons Attribution 4.0 International.
              </li>
            </ul>
            <p className="text-sm text-muted">
              Rate limits apply on the free host (per IP). Government data is provided as-is; verify
              against primary sources where required.
            </p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
