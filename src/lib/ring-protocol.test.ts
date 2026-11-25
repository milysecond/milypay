import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RING_SCHEME,
  RING_RAIL,
  RING_PRIVACY,
  base58Decode,
  base58Encode,
  isRingPayload,
  ringBindingMessage,
  ringToAtomic,
} from "../../ring/src/protocol.ts";

test("ring constants are labelled", () => {
  assert.equal(RING_SCHEME, "private-exact");
  assert.equal(RING_RAIL, "helius-rings");
  assert.equal(RING_PRIVACY, "confidential, not anonymous");
});

test("ringToAtomic", () => {
  assert.equal(ringToAtomic("0.002", 6), "2000");
  assert.equal(ringToAtomic("12.00", 6), "12000000");
  assert.equal(ringToAtomic("0.10", 6), "100000");
  assert.equal(ringToAtomic("1", 9), "1000000000");
});

test("base58 round trip incl. leading zeros", () => {
  const bytes = new Uint8Array([0, 0, 1, 2, 3, 255, 128]);
  assert.deepEqual(base58Decode(base58Encode(bytes)), bytes);
  assert.equal(base58Encode(new Uint8Array(32)), "1".repeat(32));
  assert.equal(base58Decode("11111111111111111111111111111111").length, 32);
  assert.throws(() => base58Decode("0OIl"));
});

test("isRingPayload discriminates private-exact from exact", () => {
  const proof = { txSignature: "a", payer: "b", signature: "c" };
  assert.equal(isRingPayload({ x402Version: 2, accepted: { scheme: "private-exact" }, payload: proof }), true);
  assert.equal(isRingPayload({ x402Version: 2, accepted: { scheme: "exact" }, payload: { transaction: "x" } }), false);
  assert.equal(isRingPayload({ x402Version: 2, accepted: { scheme: "private-exact" }, payload: { txSignature: "a" } }), false);
  assert.equal(isRingPayload(null), false);
});

test("binding message", () => {
  assert.equal(ringBindingMessage("SIG"), "milypay-ring:v1:SIG");
});
