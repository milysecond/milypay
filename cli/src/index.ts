#!/usr/bin/env node
import { API_BASE, DEMO_BASE, DOCS, SERVICES } from "./services.js";
import { getJson, type ClientOptions, type HostMode } from "./client.js";
import { loadWallet, walletHelp } from "./wallet.js";
import { startMcpServer } from "./mcp.js";
import { VERSION } from "./version.js";

type Args = {
  _: string[];
  host: HostMode;
  base?: string;
  json: boolean;
  quiet: boolean;
  help: boolean;
  version: boolean;
  rpc?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    _: [],
    host: "auto",
    json: false,
    quiet: false,
    help: false,
    version: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--version" || a === "-V") out.version = true;
    else if (a === "--json" || a === "-j") out.json = true;
    else if (a === "--quiet" || a === "-q") out.quiet = true;
    else if (a === "--demo") out.host = "demo";
    else if (a === "--api") out.host = "api";
    else if (a === "--base" || a === "--base-url") {
      out.base = argv[++i];
      out.host = "api"; // custom base treated as paid-capable
    } else if (a === "--rpc") out.rpc = argv[++i];
    else if (a.startsWith("-")) {
      throw new Error(`Unknown flag: ${a}`);
    } else out._.push(a);
  }
  return out;
}

function print(data: unknown, asJson: boolean) {
  if (asJson || typeof data !== "string") {
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  } else {
    process.stdout.write(data + "\n");
  }
}

function usage(): string {
  return `
milypay v${VERSION} — Australian data CLI (x402)

Usage:
  milypay <command> [args] [flags]

Commands:
  mcp                              Start MCP server (stdio) for Claude/Cursor
  services                         List endpoints + prices
  call <path>                      Raw path, e.g. /au-business/abn/51824753556
  abn <abn>                        Business by ABN
  acn <acn>                        Business by ACN
  business search <name>           ABN name search
  company <acn|name>               ASIC company lookup (digits → ACN, else search)
  company-report <acn>             Official ASIC extract ($12 on paid API)
  address validate|search|geocode <q>
  super <abn>                      Super fund by ABN
  weather <address>                Forecast for an Australian address
  weather --lat <n> --lng <n>
  bsb <bsb>                        BSB lookup (012-002 or 012002)
  bsb search <query>               Search BSBs
  postage --from <pc> --to <pc> --weight <kg> [--length --width --height]
  postage --country <cc> --weight <kg>
  whoami                           Show configured wallet
  help                             This help

MCP (Claude / Cursor):
  {
    "mcpServers": {
      "milypay": {
        "command": "npx",
        "args": ["-y", "milypay", "mcp"],
        "env": { "MILYPAY_HOST": "demo" }
      }
    }
  }
  Paid: set MILYPAY_PRIVATE_KEY and MILYPAY_HOST=api

Flags:
  --demo          Force free host (${DEMO_BASE})
  --api           Force paid host (${API_BASE}) — needs wallet
  --base <url>    Custom API base
  --rpc <url>     Solana RPC for x402 payments
  --json, -j      Pretty JSON (default for data commands)
  --quiet, -q     Suppress stderr progress
  -h, --help
  -V, --version

Wallet (paid API):
  export MILYPAY_PRIVATE_KEY=<base58 secret>
  # aliases: MILYPAY_SECRET, SOLANA_PAYER_SECRET, SOLANA_PRIVATE_KEY

Defaults:
  • Wallet set  → ${API_BASE} (pay per call in AUDD/USDC/…)
  • No wallet   → ${DEMO_BASE} (free, rate-limited)

Docs: ${DOCS}
`.trim();
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function clientOpts(args: Args): ClientOptions {
  return {
    host: args.host,
    baseUrl: args.base,
    rpcUrl: args.rpc,
    quiet: args.quiet,
  };
}

async function cmdServices() {
  const rows = SERVICES.map((s) => ({
    id: s.id,
    path: s.path,
    priceAUD: s.price,
    description: s.description,
  }));
  print(rows, true);
}

async function cmdCall(path: string, args: Args) {
  const data = await getJson(path.startsWith("/") ? path : `/${path}`, clientOpts(args));
  print(data, true);
}

async function cmdAbn(abn: string, args: Args) {
  const a = digitsOnly(abn);
  if (a.length !== 11) throw new Error("ABN must be 11 digits");
  print(await getJson(`/au-business/abn/${a}`, clientOpts(args)), true);
}

async function cmdAcn(acn: string, args: Args) {
  const a = digitsOnly(acn);
  if (a.length !== 9) throw new Error("ACN must be 9 digits");
  print(await getJson(`/au-business/acn/${a}`, clientOpts(args)), true);
}

async function cmdBusinessSearch(name: string, args: Args) {
  const q = new URLSearchParams({ name });
  print(await getJson(`/au-business/search?${q}`, clientOpts(args)), true);
}

async function cmdCompany(input: string, args: Args) {
  const d = digitsOnly(input);
  if (d.length === 9 && /^\d+$/.test(d)) {
    print(await getJson(`/au-company/acn/${d}`, clientOpts(args)), true);
  } else {
    const q = new URLSearchParams({ name: input });
    print(await getJson(`/au-company/search?${q}`, clientOpts(args)), true);
  }
}

async function cmdCompanyReport(acn: string, args: Args) {
  const a = digitsOnly(acn);
  if (a.length !== 9) throw new Error("ACN must be 9 digits");
  print(await getJson(`/au-company-report?acn=${a}`, clientOpts(args)), true);
}

async function cmdAddress(sub: string, q: string, args: Args) {
  const map: Record<string, string> = {
    validate: "validate",
    search: "search",
    geocode: "geocode",
  };
  const op = map[sub];
  if (!op) throw new Error("address subcommand: validate | search | geocode");
  const qs = new URLSearchParams({ q });
  print(await getJson(`/au-address/${op}?${qs}`, clientOpts(args)), true);
}

async function cmdSuper(abn: string, args: Args) {
  const a = digitsOnly(abn);
  if (a.length !== 11) throw new Error("ABN must be 11 digits");
  print(await getJson(`/au-super/abn/${a}`, clientOpts(args)), true);
}

async function cmdWeather(rest: string[], args: Args) {
  const qs = new URLSearchParams();
  // parse --lat --lng from rest
  const positional: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--lat") qs.set("lat", rest[++i]);
    else if (rest[i] === "--lng" || rest[i] === "--lon") qs.set("lng", rest[++i]);
    else if (rest[i] === "--days") qs.set("days", rest[++i]);
    else positional.push(rest[i]);
  }
  if (!qs.has("lat") && positional.length) qs.set("q", positional.join(" "));
  if (!qs.has("q") && !(qs.has("lat") && qs.has("lng"))) {
    throw new Error("weather needs an address or --lat/--lng");
  }
  print(await getJson(`/au-weather?${qs}`, clientOpts(args)), true);
}

async function cmdBsb(rest: string[], args: Args) {
  if (rest[0] === "search") {
    const q = rest.slice(1).join(" ");
    if (!q) throw new Error("bsb search <query>");
    print(await getJson(`/au-bsb/search?${new URLSearchParams({ q })}`, clientOpts(args)), true);
    return;
  }
  const raw = rest[0];
  if (!raw) throw new Error("bsb <number>");
  const bsb = raw.includes("-") ? raw : `${raw.slice(0, 3)}-${raw.slice(3)}`;
  print(await getJson(`/au-bsb/${encodeURIComponent(bsb)}`, clientOpts(args)), true);
}

async function cmdPostage(rest: string[], args: Args) {
  const qs = new URLSearchParams();
  for (let i = 0; i < rest.length; i++) {
    const k = rest[i];
    if (k === "--from") qs.set("from", rest[++i]);
    else if (k === "--to") qs.set("to", rest[++i]);
    else if (k === "--weight") qs.set("weight", rest[++i]);
    else if (k === "--length") qs.set("length", rest[++i]);
    else if (k === "--width") qs.set("width", rest[++i]);
    else if (k === "--height") qs.set("height", rest[++i]);
    else if (k === "--country") qs.set("country", rest[++i]);
    else throw new Error(`Unknown postage flag: ${k}`);
  }
  if (!qs.has("weight")) throw new Error("postage requires --weight <kg>");
  if (!qs.has("country") && !(qs.has("from") && qs.has("to"))) {
    throw new Error("postage requires --from/--to or --country");
  }
  print(await getJson(`/au-postage?${qs}`, clientOpts(args)), true);
}

async function main() {
  // MCP takes over stdio — handle before any other stdout writes
  const rawArgv = process.argv.slice(2);
  if (rawArgv[0] === "mcp") {
    // Optional host flags before attach
    for (let i = 1; i < rawArgv.length; i++) {
      if (rawArgv[i] === "--demo") process.env.MILYPAY_HOST = "demo";
      else if (rawArgv[i] === "--api") process.env.MILYPAY_HOST = "api";
      else if ((rawArgv[i] === "--base" || rawArgv[i] === "--base-url") && rawArgv[i + 1]) {
        process.env.MILYPAY_BASE_URL = rawArgv[++i];
      } else if (rawArgv[i] === "--rpc" && rawArgv[i + 1]) {
        process.env.SOLANA_RPC_URL = rawArgv[++i];
      }
    }
    await startMcpServer();
    return;
  }

  const args = parseArgs(rawArgv);
  if (args.version) {
    print(VERSION, false);
    return;
  }
  if (args.help || args._.length === 0) {
    process.stdout.write(usage() + "\n");
    return;
  }

  const [cmd, ...rest] = args._;

  switch (cmd) {
    case "help":
      process.stdout.write(usage() + "\n");
      break;
    case "services":
    case "ls":
    case "list":
      await cmdServices();
      break;
    case "call":
    case "get":
      if (!rest[0]) throw new Error("call <path>");
      await cmdCall(rest[0], args);
      break;
    case "abn":
      if (!rest[0]) throw new Error("abn <abn>");
      await cmdAbn(rest[0], args);
      break;
    case "acn":
      if (!rest[0]) throw new Error("acn <acn>");
      await cmdAcn(rest[0], args);
      break;
    case "business":
      if (rest[0] === "search") {
        if (!rest[1]) throw new Error("business search <name>");
        await cmdBusinessSearch(rest.slice(1).join(" "), args);
      } else if (rest[0] === "abn" && rest[1]) await cmdAbn(rest[1], args);
      else if (rest[0] === "acn" && rest[1]) await cmdAcn(rest[1], args);
      else throw new Error("business search <name> | business abn <abn> | business acn <acn>");
      break;
    case "company":
      if (!rest[0]) throw new Error("company <acn|name>");
      await cmdCompany(rest.join(" "), args);
      break;
    case "company-report":
    case "extract":
      if (!rest[0]) throw new Error("company-report <acn>");
      await cmdCompanyReport(rest[0], args);
      break;
    case "address":
      if (!rest[0] || !rest[1]) throw new Error("address validate|search|geocode <query>");
      await cmdAddress(rest[0], rest.slice(1).join(" "), args);
      break;
    case "super":
      if (!rest[0]) throw new Error("super <abn>");
      await cmdSuper(rest[0], args);
      break;
    case "weather":
      await cmdWeather(rest, args);
      break;
    case "bsb":
      await cmdBsb(rest, args);
      break;
    case "postage":
      await cmdPostage(rest, args);
      break;
    case "whoami": {
      const w = loadWallet();
      if (!w) {
        process.stderr.write(walletHelp() + "\n");
        process.exitCode = 1;
        break;
      }
      print({ address: w.address, source: w.source, api: API_BASE, demo: DEMO_BASE }, true);
      break;
    }
    default:
      throw new Error(`Unknown command: ${cmd}\n\n${usage()}`);
  }
}

main().catch((e) => {
  process.stderr.write(`Error: ${(e as Error).message}\n`);
  process.exit(1);
});
