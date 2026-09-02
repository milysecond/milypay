import { ApiLanding, apiMetadata } from "@/components/ApiLanding";

const props = {
  title: "ASIC company API | Milypay",
  description:
    "ASIC company API for Australian companies by ACN or name. Open data search plus paid extract. x402, no API key.",
  canonical: "/asic-company-api",
  h1: "ASIC company API",
  lede: "Search the ASIC company register by ACN or name. Open-data lookup is pay-per-call on x402. Official extracts are a separate always-paid route.",
  demoPath: "/au-company/acn/000014675",
  paidPath: "/au-company/acn/000014675",
  price: "0.002 AUDD lookup · extract extra",
  source: "ASIC open data (extract is official product, not free gov JSON)",
  sample: `{
  "acn": "000014675",
  "name": "WOOLWORTHS GROUP LIMITED",
  "status": "Registered"
}`,
  related: [
    { href: "/abn-lookup-api", label: "ABN lookup API" },
    { href: "/docs#company-report", label: "ASIC extract docs" },
  ],
};

export const metadata = apiMetadata(props);
export default function Page() {
  return <ApiLanding {...props} />;
}
