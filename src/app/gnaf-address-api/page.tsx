import { ApiLanding, apiMetadata } from "@/components/ApiLanding";

const props = {
  title: "G-NAF address API | Milypay",
  description:
    "Australian address validate and geocode API on G-NAF. Free demo curl, paid x402. No API key.",
  canonical: "/gnaf-address-api",
  h1: "G-NAF address API",
  lede: "Validate and geocode Australian addresses against G-NAF. Agents pay per call. Demo is throttled on milypay.xyz/api.",
  demoPath: "/au-address/validate?q=1%20Collins%20St%20Melbourne",
  paidPath: "/au-address/validate?q=1%20Collins%20St%20Melbourne",
  price: "0.002 AUDD (paid host)",
  source: "Geocoded National Address File (G-NAF)",
  sample: `{
  "query": "1 Collins St Melbourne",
  "valid": true,
  "state": "VIC"
}`,
  related: [
    { href: "/abn-lookup-api", label: "ABN lookup API" },
    { href: "/bsb-api", label: "BSB API" },
  ],
};

export const metadata = apiMetadata(props);
export default function Page() {
  return <ApiLanding {...props} />;
}
