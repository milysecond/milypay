// Cloudflare Workers cannot compile WebAssembly from bytes at runtime, which is
// what @lightprotocol/hasher.rs's default ("fat") build does. Wrangler aliases
// that package to this shim, which hands the slim build precompiled modules.
// @ts-expect-error wasm module import (wrangler CompiledWasm rule)
import simd from "../../ring/node_modules/@lightprotocol/hasher.rs/dist/hasher_wasm_simd_bg.wasm";
// @ts-expect-error wasm module import (wrangler CompiledWasm rule)
import sisd from "../../ring/node_modules/@lightprotocol/hasher.rs/dist/light_wasm_hasher_bg.wasm";
// @ts-expect-error untyped deep import of the slim build
import { WasmFactory as Slim, hasWasmSimd } from "../../ring/node_modules/@lightprotocol/hasher.rs/dist/browser-slim/es/index_browser_slim.js";

type Opts = { simd?: boolean; wasm?: unknown } | undefined;
const withModules = (o: Opts) => ({ ...(o ?? {}), wasm: { simd, sisd } });

export class WasmFactory {
  static loadModule(o?: Opts) {
    return Slim.loadModule(withModules(o));
  }
  static loadHasher(o?: Opts) {
    return Slim.loadHasher(withModules(o));
  }
  static resetModule() {
    return Slim.resetModule();
  }
  static getInstance() {
    return Slim.loadHasher(withModules(undefined));
  }
}
export { hasWasmSimd };
