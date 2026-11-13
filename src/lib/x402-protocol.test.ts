import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  PAYAI_DEVNET_FEE_PAYER_FALLBACK,
  PAYAI_MAINNET_FEE_PAYER_FALLBACK,
  SOLANA_DEVNET_CAIP,
  SOLANA_MAINNET_CAIP,
  facilitatorFailureReason,
  fallbackFeePayer,
  networksMatch,
  paymentVersion,
  prepareFacilitatorRequest,
  readPaymentHeader,
  resetFeePayerCacheForTests,
  resolveFeePayer,
  sanitizeForLog,
  selectFeePayer,
  settlementSucceeded,
  verifySucceeded,
  type PaymentRequirements,
  type SupportedKind,
} from "./x402-protocol.ts";

const MAINNET = PAYAI_MAINNET_FEE_PAYER_FALLBACK;
const DEVNET = PAYAI_DEVNET_FEE_PAYER_FALLBACK;

/** Trimmed from facilitator.payai.network/supported on 2026-11-13. */
const SUPPORTED: SupportedKind[] = [
  {
    x402Version: 1,
    scheme: "exact",
    network: "solana",
    extra: { feePayer: MAINNET },
  },
  {
    x402Version: 1,
    scheme: "exact",
    network: "solana-devnet",
    extra: { feePayer: DEVNET },
  },
  {
    x402Version: 2,
    scheme: "exact",
    network: SOLANA_MAINNET_CAIP,
    extra: { feePayer: MAINNET },
  },
  {
    x402Version: 2,
    scheme: "batch-settlement",
    network: SOLANA_MAINNET_CAIP,
    extra: { feePayer: "BatchPayerNotUsedForExact111111111111111" },
  },
  {
    x402Version: 2,
    scheme: "exact",
    network: SOLANA_DEVNET_CAIP,
    extra: { feePayer: DEVNET },
  },
];

const REQS: PaymentRequirements = {
  scheme: "exact",
  network: SOLANA_MAINNET_CAIP,
  amount: "2000",
  asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  payTo: "mi1ytDfgNFYgm54y4f3xzRQbfbyCz6TBmQcAL3brozA",
  maxTimeoutSeconds: 60,
  extra: { feePayer: DEVNET },
};

afterEach(() => {
  resetFeePayerCacheForTests();
});

describe("selectFeePayer", () => {
  it("uses the v2 exact mainnet payer, not the devnet or batch payer", () => {
    assert.equal(selectFeePayer(SUPPORTED, SOLANA_MAINNET_CAIP), MAINNET);
    assert.equal(selectFeePayer(SUPPORTED, SOLANA_DEVNET_CAIP), DEVNET);
    assert.equal(selectFeePayer(SUPPORTED, "solana"), MAINNET);
    assert.equal(selectFeePayer(SUPPORTED, "solana-devnet"), DEVNET);
  });

  it("falls back to the v1 kind when v2 exact is missing", () => {
    const kinds = SUPPORTED.filter(
      (k) => !(k.x402Version === 2 && k.scheme === "exact" && k.network === SOLANA_MAINNET_CAIP),
    );
    assert.equal(selectFeePayer(kinds, SOLANA_MAINNET_CAIP), MAINNET);
  });

  it("returns null when the network is absent", () => {
    assert.equal(selectFeePayer(SUPPORTED, "eip155:8453"), null);
  });
});

describe("fallbackFeePayer", () => {
  it("prefers the env override, otherwise the public payer for that chain", () => {
    assert.equal(fallbackFeePayer(SOLANA_MAINNET_CAIP), MAINNET);
    assert.equal(fallbackFeePayer(SOLANA_DEVNET_CAIP), DEVNET);
    assert.equal(fallbackFeePayer(SOLANA_MAINNET_CAIP, "EnvPayer111"), "EnvPayer111");
    assert.notEqual(fallbackFeePayer(SOLANA_MAINNET_CAIP), DEVNET);
  });
});

describe("resolveFeePayer", () => {
  function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
    const calls: Array<{ url: string; auth: string | null }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      calls.push({ url, auth: headers.get("authorization") });
      return handler(url, init);
    };
    return { fetchImpl, calls };
  }

  it("reads /supported and does not refetch inside the ttl", async () => {
    let hits = 0;
    const { fetchImpl } = mockFetch(async () => {
      hits += 1;
      return new Response(JSON.stringify({ kinds: SUPPORTED }), { status: 200 });
    });
    const deps = {
      facilitator: "https://facilitator.payai.network",
      fetchImpl,
      now: () => 1_000,
      envFallback: DEVNET,
      ttlMs: 60_000,
    };
    assert.equal(await resolveFeePayer(SOLANA_MAINNET_CAIP, deps), MAINNET);
    assert.equal(await resolveFeePayer(SOLANA_MAINNET_CAIP, deps), MAINNET);
    assert.equal(hits, 1);
  });

  it("refetches after the ttl and keeps the previous payer if the refresh fails", async () => {
    let now = 0;
    let hits = 0;
    const { fetchImpl } = mockFetch(async () => {
      hits += 1;
      if (hits === 1) {
        return new Response(JSON.stringify({ kinds: SUPPORTED }), { status: 200 });
      }
      return new Response("nope", { status: 503 });
    });
    const deps = {
      facilitator: "https://facilitator.example",
      fetchImpl,
      now: () => now,
      envFallback: "StaleEnvPayer",
      ttlMs: 1_000,
    };
    assert.equal(await resolveFeePayer(SOLANA_MAINNET_CAIP, deps), MAINNET);
    now = 5_000;
    assert.equal(await resolveFeePayer(SOLANA_MAINNET_CAIP, deps), MAINNET);
    assert.equal(hits, 2);
  });

  it("uses PAYAI_FEE_PAYER then the mainnet builtin when /supported fails", async () => {
    const { fetchImpl } = mockFetch(async () => new Response("", { status: 500 }));
    assert.equal(
      await resolveFeePayer(SOLANA_MAINNET_CAIP, {
        facilitator: "https://facilitator.example",
        fetchImpl,
        envFallback: "EnvOnly",
      }),
      "EnvOnly",
    );
    resetFeePayerCacheForTests();
    assert.equal(
      await resolveFeePayer(SOLANA_MAINNET_CAIP, {
        facilitator: "https://facilitator.example",
        fetchImpl,
      }),
      MAINNET,
    );
  });

  it("still reads the public payer when signing the merchant token throws", async () => {
    const { fetchImpl, calls } = mockFetch(async () => {
      return new Response(JSON.stringify({ kinds: SUPPORTED }), { status: 200 });
    });
    const payer = await resolveFeePayer(SOLANA_MAINNET_CAIP, {
      facilitator: "https://facilitator.example",
      fetchImpl,
      authHeaders: async () => {
        throw new Error("bad pkcs8");
      },
    });
    assert.equal(payer, MAINNET);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.auth, null);
  });

  it("retries without auth when the merchant token is rejected", async () => {
    const { fetchImpl, calls } = mockFetch(async (_url, init) => {
      const auth = new Headers(init?.headers).get("authorization");
      if (auth) return new Response("no", { status: 401 });
      return new Response(JSON.stringify({ kinds: SUPPORTED }), { status: 200 });
    });
    const payer = await resolveFeePayer(SOLANA_MAINNET_CAIP, {
      facilitator: "https://facilitator.example/",
      fetchImpl,
      authHeaders: async () => ({ Authorization: "Bearer secret-jwt" }),
    });
    assert.equal(payer, MAINNET);
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.auth, "Bearer secret-jwt");
    assert.equal(calls[1]?.auth, null);
    assert.equal(calls[0]?.url, "https://facilitator.example/supported");
  });
});

describe("payment header and version", () => {
  it("accepts X-PAYMENT and prefers PAYMENT-SIGNATURE", () => {
    const both = new Headers({
      "PAYMENT-SIGNATURE": "v2",
      "X-PAYMENT": "v1",
    });
    assert.deepEqual(readPaymentHeader(both), { raw: "v2", via: "PAYMENT-SIGNATURE" });
    const legacy = new Headers({ "x-payment": "legacy" });
    assert.deepEqual(readPaymentHeader(legacy), { raw: "legacy", via: "X-PAYMENT" });
    assert.equal(readPaymentHeader(new Headers()), null);
  });

  it("detects v1 and v2 payloads", () => {
    assert.equal(
      paymentVersion({ x402Version: 1, scheme: "exact", network: "solana", payload: {} }),
      1,
    );
    assert.equal(paymentVersion({ x402Version: 2, accepted: { scheme: "exact" }, payload: {} }), 2);
    assert.equal(paymentVersion({ scheme: "exact", network: "solana", payload: {} }), 1);
  });
});

describe("prepareFacilitatorRequest", () => {
  it("sends v2 amount and the current fee payer, not the stale one on the requirement", () => {
    const body = prepareFacilitatorRequest({
      version: 2,
      payload: { x402Version: 2 },
      requirements: REQS,
      resource: { url: "https://api.milypay.xyz/au-business/abn/1", description: "ABN" },
      feePayer: MAINNET,
    });
    assert.equal(body.x402Version, 2);
    assert.equal(body.paymentRequirements.amount, "2000");
    assert.equal(body.paymentRequirements.network, SOLANA_MAINNET_CAIP);
    assert.equal(
      (body.paymentRequirements.extra as { feePayer: string }).feePayer,
      MAINNET,
    );
    assert.equal("maxAmountRequired" in body.paymentRequirements, false);
  });

  it("shapes v1 requirements with maxAmountRequired and the v1 network name", () => {
    const body = prepareFacilitatorRequest({
      version: 1,
      payload: { x402Version: 1, scheme: "exact", network: "solana" },
      requirements: REQS,
      resource: {
        url: "https://api.milypay.xyz/au-business/abn/1",
        description: "ABN lookup",
        mimeType: "application/json",
      },
      feePayer: MAINNET,
    });
    assert.equal(body.x402Version, 1);
    assert.equal(body.paymentRequirements.maxAmountRequired, "2000");
    assert.equal(body.paymentRequirements.network, "solana");
    assert.equal(body.paymentRequirements.resource, "https://api.milypay.xyz/au-business/abn/1");
    assert.equal(body.paymentRequirements.description, "ABN lookup");
    assert.equal("amount" in body.paymentRequirements, false);
    assert.equal(
      (body.paymentRequirements.extra as { feePayer: string }).feePayer,
      MAINNET,
    );
  });
});

describe("facilitator results", () => {
  it("surfaces invalidReason from an HTTP 200 verify failure", () => {
    const body = {
      isValid: false,
      invalidReason: "invalid_exact_svm_payload_transaction_could_not_be_decoded",
      payer: "",
    };
    assert.equal(verifySucceeded(true, body), false);
    assert.equal(
      facilitatorFailureReason(body, 200),
      "invalid_exact_svm_payload_transaction_could_not_be_decoded",
    );
    assert.equal(
      facilitatorFailureReason(
        { success: false, errorReason: "insufficient_funds", errorMessage: "payer balance" },
        200,
      ),
      "insufficient_funds: payer balance",
    );
  });

  it("treats explicit settle failure as unpaid even when HTTP is 200", () => {
    assert.equal(settlementSucceeded(true, { success: false, errorReason: "invalid_payload", transaction: "" }), false);
    assert.equal(settlementSucceeded(true, { success: true, transaction: "sig", network: "solana" }), true);
    assert.equal(settlementSucceeded(true, { transaction: "sig" }), true);
    assert.equal(networksMatch("solana", SOLANA_MAINNET_CAIP), true);
    assert.equal(networksMatch("solana", SOLANA_DEVNET_CAIP), false);
  });

  it("redacts secret-like keys before logging", () => {
    const clean = sanitizeForLog({
      invalidReason: "invalid_payload",
      authorization: "Bearer secret",
      nested: { apiKey: "k", payer: "addr" },
    }) as { authorization: string; nested: { apiKey: string; payer: string } };
    assert.equal(clean.authorization, "[redacted]");
    assert.equal(clean.nested.apiKey, "[redacted]");
    assert.equal(clean.nested.payer, "addr");
  });
});
