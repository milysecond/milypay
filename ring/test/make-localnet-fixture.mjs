// Creates a localnet merchant + a paid private transfer, writes ../ring-worker/.dev.vars
import crypto from "node:crypto"; import fs from "node:fs";
import { RingWallet } from "../dist/index.js";
import { ShieldedKeypair, SigningKey, initializePoseidon } from "@heliuslabs/spr";
const L = { rpcUrl: "http://127.0.0.1:8899", indexerUrl: "http://127.0.0.1:8784", proverUrl: "http://127.0.0.1:3001", network: "localnet" };
await initializePoseidon();
const m = ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(crypto.randomBytes(32)));
const vk = Buffer.from(m.viewingKey().secretBytes()).toString("hex");
const addr = Buffer.from(m.shieldedAddress().toBytes()).toString("hex");
const payer = await RingWallet.create(crypto.randomBytes(32), L);
await fetch(L.rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "requestAirdrop", params: [payer.address, 2e9] }) });
await new Promise((r) => setTimeout(r, 2500));
await payer.shield("SOL", "0.05");
const pay = await payer.transfer(addr, "11111111111111111111111111111111", 2000n);
fs.writeFileSync("../ring-worker/.dev.vars", `RING_VIEWING_KEY=${vk}\nHELIUS_RPC_URL=http://127.0.0.1:8899\nRING_INDEXER_URL=http://127.0.0.1:8784\n`, { mode: 0o600 });
fs.writeFileSync("/tmp/ring-fixture.json", JSON.stringify({ addr, payTo: m.shieldedAddress().solanaAddress(), proof: payer.bind(pay.signature) }));
console.log("fixture ok", pay.signature.slice(0, 12));
process.exit(0);
