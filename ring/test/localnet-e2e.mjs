// Manual end-to-end test against `zolana dev start` (localnet, no real funds).
//   node test/localnet-e2e.mjs
import crypto from "node:crypto";
import { RingWallet, ringBindingMessage } from "../dist/index.js";
import { verifyRingPayment } from "../dist/verify.js";
import { ShieldedKeypair, SigningKey, initializePoseidon } from "@heliuslabs/spr";

const L = { rpcUrl: "http://127.0.0.1:8899", indexerUrl: "http://127.0.0.1:8784", proverUrl: "http://127.0.0.1:3001", network: "localnet" };
const SOL = "11111111111111111111111111111111";
const rpc = async (m, p) => (await (await fetch(L.rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: m, params: p }) })).json());

await initializePoseidon();
// Merchant: server holds only viewing key + public address.
const mSeed = crypto.randomBytes(32);
const merchant = ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(mSeed));
const viewingKeyHex = Buffer.from(merchant.viewingKey().secretBytes()).toString("hex");
const shieldedAddressHex = Buffer.from(merchant.shieldedAddress().toBytes()).toString("hex");

const payer = await RingWallet.create(crypto.randomBytes(32), L);
await rpc("requestAirdrop", [payer.address, 2_000_000_000]);
await new Promise((r) => setTimeout(r, 2500));
console.log("payer", payer.address, "public SOL", (await payer.publicSol()).toString());
const dep = await payer.shield("SOL", "0.05");
console.log("shielded", dep.signature, "private", (await payer.balance("SOL")).amount);

const price = 1_500_000n;
const t0 = Date.now();
const pay = await payer.transfer(shieldedAddressHex, SOL, price);
console.log("paid", pay.signature, "in", Date.now() - t0, "ms (local CPU prover)");
const proof = payer.bind(pay.signature);

const base = { rpcUrl: L.rpcUrl, indexerUrl: L.indexerUrl, viewingKeyHex, shieldedAddressHex, mint: SOL };
const ok = await verifyRingPayment({ ...base, ...proof, minAmount: price });
console.log("verify exact:", ok.ok ? `OK amount=${ok.amount}` : ok);
const under = await verifyRingPayment({ ...base, ...proof, minAmount: price + 1n });
console.log("verify underpaid:", under.ok ? "UNEXPECTED OK" : under.code);
const other = await RingWallet.create(crypto.randomBytes(32), L);
const stolen = await verifyRingPayment({ ...base, ...other.bind(pay.signature), minAmount: price });
console.log("verify other payer claims tx:", stolen.ok ? "UNEXPECTED OK" : stolen.code);
const badSig = await verifyRingPayment({ ...base, ...proof, signature: other.bind(pay.signature).signature, minAmount: price });
console.log("verify forged binding:", badSig.ok ? "UNEXPECTED OK" : badSig.code);
const wrongMint = await verifyRingPayment({ ...base, ...proof, mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", minAmount: 1n });
console.log("verify wrong asset:", wrongMint.ok ? "UNEXPECTED OK" : wrongMint.code);
const notRing = await verifyRingPayment({ ...base, ...payer.bind(dep.signature), minAmount: 1n });
console.log("verify deposit-to-self tx:", notRing.ok ? "UNEXPECTED OK" : notRing.code);
// Different merchant key must not see the payment.
const m2 = ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(crypto.randomBytes(32)));
const foreign = await verifyRingPayment({ ...base, viewingKeyHex: Buffer.from(m2.viewingKey().secretBytes()).toString("hex"), shieldedAddressHex: Buffer.from(m2.shieldedAddress().toBytes()).toString("hex"), ...proof, minAmount: 1n });
console.log("verify wrong merchant:", foreign.ok ? "UNEXPECTED OK" : foreign.code);
console.log("binding message:", ringBindingMessage(pay.signature).slice(0, 30) + "…");
process.exit(0);
