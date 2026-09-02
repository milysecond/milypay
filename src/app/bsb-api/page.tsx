import { ApiLanding, apiMetadata } from "@/components/ApiLanding";

const props = {
  title: "BSB API | Milypay",
  description:
    "Australian BSB lookup API. Bank, branch, and state for a 6-digit BSB. Free demo, paid x402. No API key.",
  canonical: "/bsb-api",
  h1: "BSB API",
  lede: "Resolve a 6-digit BSB to bank and branch details. Same x402 rail as ABN: demo on milypay.xyz/api, paid on api.milypay.xyz.",
  demoPath: "/au-bsb/032000",
  paidPath: "/au-bsb/032000",
  price: "0.002 AUDD (paid host)",
  source: "Australian payments BSB directory",
  sample: `{
  "bsb": "032-000",
  "bank": "Westpac",
  "branch": "example",
  "state": "NSW"
}`,
  related: [
    { href: "/abn-lookup-api", label: "ABN lookup API" },
    { href: "/gnaf-address-api", label: "G-NAF address API" },
  ],
};

export const metadata = apiMetadata(props);
export default function Page() {
  return <ApiLanding {...props} />;
}
