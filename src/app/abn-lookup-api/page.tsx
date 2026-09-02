import { ApiLanding, apiMetadata } from "@/components/ApiLanding";

const props = {
  title: "ABN lookup API | Milypay",
  description:
    "ABN lookup API for Australian businesses. Free demo curl, paid x402 on Solana. Entity name, GST, status from the ABR. No API key.",
  canonical: "/abn-lookup-api",
  h1: "ABN lookup API",
  lede: "Look up an 11-digit Australian Business Number and get entity name, status, type, GST, and location. Built for agents: pay per call over HTTP 402, or hit the free demo on milypay.xyz/api.",
  demoPath: "/au-business/abn/51824753556",
  paidPath: "/au-business/abn/51824753556",
  price: "0.002 AUDD (paid host)",
  source: "Australian Business Register (ATO)",
  sample: `{
  "abn": "51824753556",
  "abnStatus": "Active",
  "entityName": "AUSTRALIAN TAXATION OFFICE",
  "entityType": "Commonwealth Government Entity",
  "gstRegistered": true,
  "state": "NSW",
  "postcode": "2640"
}`,
  related: [
    { href: "/asic-company-api", label: "ASIC company API" },
    { href: "/bsb-api", label: "BSB API" },
  ],
};

export const metadata = apiMetadata(props);
export default function Page() {
  return <ApiLanding {...props} />;
}
