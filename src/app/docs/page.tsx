import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import CodeBlock from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Docs | MilyPay",
  description:
    "MilyPay API documentation: Australian business, company, address, super fund, and weather endpoints, with x402 (AUDD) payment details and examples.",
  alternates: { canonical: "/docs" },
};

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "payments", label: "Payments (x402)" },
  { id: "business", label: "Business identity" },
  { id: "company", label: "Company register" },
  { id: "address", label: "Address" },
  { id: "super", label: "Super funds" },
  { id: "weather", label: "Weather" },
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
        desc: "Companies matching a name, across current and former names.",
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
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">
              Documentation
            </p>
            <H id="overview">MilyPay API</H>
            <p className="leading-relaxed text-muted">
              Pay-per-call Australian data for AI agents, settled in AUD stablecoins on the x402
              rail. Five services: business identity, company register, address, super funds, and
              weather. Responses are JSON. No API keys.
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
              free and per-IP rate limited, so you can try every service without paying.
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
              <li>Company: ASIC Company Register, published open on data.gov.au.</li>
              <li>Address: Incorporates G-NAF &copy; Geoscape Australia, open G-NAF licence. Per-call lookups only.</li>
              <li>Weather: Open-Meteo.com (CC BY 4.0), Australian model BOM ACCESS-G.</li>
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
