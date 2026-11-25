import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site";
import CodeBlock from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Private payments with Helius Rings (beta) | Milypay",
  description:
    "Pay any Milypay endpoint with a confidential Helius Privacy Rings transfer: amount and asset hidden on-chain, sender and recipient public. Beta.",
  alternates: { canonical: "/docs/ring" },
};

const CHALLENGE = `{
  "scheme": "private-exact",
  "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "amount": "2000",
  "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "payTo": "<Milypay ring identity>",
  "maxTimeoutSeconds": 600,
  "extra": {
    "rail": "helius-rings",
    "label": "beta",
    "privacy": "confidential, not anonymous",
    "ring": "default",
    "shieldedAddress": "<hex, 99 bytes>",
    "symbol": "USDC",
    "endpoints": {
      "rpcUrl": "https://api.milypay.xyz/ring/rpc",
      "indexerUrl": "https://api.milypay.xyz/ring/indexer",
      "proverUrl": "https://api.milypay.xyz/ring/prover"
    },
    "binding": "milypay-ring:v1:<txSignature>",
    "retryWindowSeconds": 600
  }
}`;

const PAYLOAD = `PAYMENT-SIGNATURE: base64({
  "x402Version": 2,
  "accepted": { ...the private-exact entry you paid... },
  "payload": {
    "txSignature": "<private transfer signature>",
    "payer": "<Solana address that signed it>",
    "signature": "<ed25519 sig by payer over milypay-ring:v1:<txSignature>>"
  }
})`;

const CLI = `# Node >= 22.12. Your wallet key is read from MILYPAY_PRIVATE_KEY.
milypay ring address                 # your shielded address
milypay ring shield 0.10 --asset USDC
milypay ring balance
milypay company 695484756 --rail ring   # pays privately from your ring balance
milypay ring unshield 0.05 --asset USDC`;

export default function RingDocs() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">Payments · beta</p>
        <h1 className="font-display mt-3 text-4xl tracking-tight">Private payments with Helius Rings</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Every paid Milypay endpoint also accepts a <strong>private transfer</strong> inside the Helius Privacy
          Rings Default Ring. It is <strong>confidential, not anonymous</strong>: the asset and amount are hidden
          on-chain, but the sender and the recipient (Milypay) are public. Accepted assets: USDC and AUDD.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted">
          <li>Call any endpoint on api.milypay.xyz. The 402 challenge lists the usual <code>exact</code> entries plus one <code>private-exact</code> entry (rail <code>helius-rings</code>) per ring asset.</li>
          <li>Shield funds into your ring balance once, then send a private transfer of at least <code>amount</code> to the advertised <code>shieldedAddress</code>.</li>
          <li>Sign <code>milypay-ring:v1:&lt;txSignature&gt;</code> with the key that signed the transfer and retry with <code>PAYMENT-SIGNATURE</code>.</li>
          <li>Milypay decrypts the transfer with its viewing key, checks the amount, then serves the response. Each transfer pays for one request.</li>
        </ol>
        <CodeBlock label="402 accepts[] entry" code={CHALLENGE} />
        <CodeBlock label="Retry header" code={PAYLOAD} />

        <h2 className="mt-10 text-2xl font-semibold">Retries and errors</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-muted">
          <li><code>409</code> with <code>retryable: true</code> (for example <code>indexer_pending</code> or <code>payment_in_flight</code>): wait two seconds and resend the same header.</li>
          <li>If the endpoint fails after your payment verified, resend the same header for the same URL within 600 seconds. It will not be charged twice.</li>
          <li><code>payment_already_used</code>: that transfer already paid for a served request.</li>
          <li>Transfers older than 7 days are not accepted.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">Sponsored endpoints</h2>
        <p className="mt-3 text-muted">
          Milypay sponsors Helius RPC, privacy indexer and TEE prover access for payers at
          <code> api.milypay.xyz/ring/rpc</code>, <code>/ring/indexer</code> and <code>/ring/prover</code>. They are
          rate-limited per client and capped per day (HTTP 429 <code>ring_proxy_capped</code>). Prover requests are
          end-to-end encrypted to the Helius TEE, so Milypay cannot read them.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">CLI and SDK</h2>
        <CodeBlock label="milypay CLI" code={CLI} />
        <p className="mt-3 text-muted">
          The <code>@milypay/ring</code> package exposes <code>RingWallet</code> and <code>ringFetch</code> for your own
          agents. The MCP server adds <code>ring_status</code>, <code>ring_balance</code>, <code>ring_shield</code>,{" "}
          <code>ring_unshield</code> and <code>ring_pay</code>.
        </p>

        <p className="mt-10 text-sm text-muted">
          Beta. Helius Privacy Rings is an alpha SDK; the program is upgradeable by Helius. Use small amounts. See{" "}
          <Link href="/docs" className="underline">the main docs</Link> and{" "}
          <Link href="/protocols" className="underline">protocols</Link>.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
