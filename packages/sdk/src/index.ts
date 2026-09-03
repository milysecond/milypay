import { Keypair, type VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { createX402Client } from "x402-solana/client";

export const DEMO_BASE = "https://milypay.xyz";
export const API_BASE = "https://api.milypay.xyz";

export type HostMode = "auto" | "api" | "demo";

export type MilypayOptions = {
  host?: HostMode;
  baseUrl?: string;
  /** base58 secret or JSON byte array */
  privateKey?: string;
  rpcUrl?: string;
  maxAmount?: bigint;
  fetch?: typeof fetch;
};

export type PaymentReceipt = {
  raw: unknown;
  signature?: string;
  explorerUrl?: string;
  network?: string;
  asset?: string;
  amount?: string;
};

export type WithReceipt<T> = T & { $receipt?: PaymentReceipt };

function decodeSecret(raw: string): Uint8Array {
  const s = raw.trim();
  if (s.startsWith("[")) return Uint8Array.from(JSON.parse(s) as number[]);
  return bs58.decode(s);
}

function resolveBase(host: HostMode, hasKey: boolean, override?: string): string {
  if (override) return override.replace(/\/$/, "");
  if (host === "api") return API_BASE;
  if (host === "demo") return DEMO_BASE;
  return hasKey ? API_BASE : DEMO_BASE;
}

function withHostPath(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base === DEMO_BASE || (base.includes("milypay.xyz") && !base.includes("api.milypay.xyz"))) {
    if (p.startsWith("/api/") || p === "/api") return `${base}${p}`;
    return `${base}/api${p}`;
  }
  return `${base}${p}`;
}

function parseReceipt(header: string | null): PaymentReceipt | undefined {
  if (!header) return undefined;
  try {
    const raw = JSON.parse(atob(header)) as Record<string, unknown>;
    const sig =
      (typeof raw.transaction === "string" && raw.transaction) ||
      (typeof raw.signature === "string" && raw.signature) ||
      (typeof raw.txHash === "string" && raw.txHash) ||
      (typeof (raw as { transaction?: { signature?: string } }).transaction === "object" &&
        (raw as { transaction?: { signature?: string } }).transaction?.signature) ||
      undefined;
    const network = typeof raw.network === "string" ? raw.network : "solana";
    const explorerUrl = sig
      ? `https://sol.new/receipt/${sig}`
      : undefined;
    return {
      raw,
      signature: sig || undefined,
      explorerUrl,
      network,
      asset: typeof raw.asset === "string" ? raw.asset : undefined,
      amount: typeof raw.amount === "string" ? raw.amount : undefined,
    };
  } catch {
    return { raw: header };
  }
}

export class Milypay {
  private base: string;
  private fetcher: typeof fetch;
  private x402?: ReturnType<typeof createX402Client>;
  readonly walletAddress?: string;

  constructor(opts: MilypayOptions = {}) {
    const key =
      opts.privateKey ||
      process.env.MILYPAY_PRIVATE_KEY ||
      process.env.MILYPAY_SECRET ||
      process.env.SOLANA_PAYER_SECRET ||
      process.env.SOLANA_PRIVATE_KEY;
    const host = opts.host || "auto";
    this.base = resolveBase(host, Boolean(key), opts.baseUrl);
    this.fetcher = opts.fetch || fetch;

    if (key) {
      const kp = Keypair.fromSecretKey(decodeSecret(key));
      this.walletAddress = kp.publicKey.toBase58();
      const paidBase =
        this.base.includes("api.milypay.xyz") || host === "api" || Boolean(opts.baseUrl);
      if (paidBase) {
        this.x402 = createX402Client({
          wallet: {
            address: this.walletAddress,
            signTransaction: async (tx: VersionedTransaction) => {
              tx.sign([kp]);
              return tx;
            },
          },
          network: "solana",
          rpcUrl:
            opts.rpcUrl ||
            process.env.SOLANA_RPC_URL ||
            process.env.HELIUS_RPC_URL ||
            "https://solana-rpc.publicnode.com",
          amount: opts.maxAmount ?? BigInt(50_000_000),
        });
      }
    }
  }

  async get<T = unknown>(path: string): Promise<WithReceipt<T>> {
    const url = path.startsWith("http") ? path : withHostPath(this.base, path);
    const res = this.x402
      ? await this.x402.fetch(url, {
          headers: { accept: "application/json", "user-agent": "milypay-sdk/0.1.0" },
        })
      : await this.fetcher(url, {
          headers: { accept: "application/json", "user-agent": "milypay-sdk/0.1.0" },
        });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* keep */
    }
    if (!res.ok) {
      const msg =
        typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : text.slice(0, 400);
      const err = new Error(`HTTP ${res.status}: ${msg}`) as Error & {
        status?: number;
        body?: unknown;
        code?: string;
      };
      err.status = res.status;
      err.body = data;
      err.code =
        typeof data === "object" && data && "code" in data
          ? String((data as { code: unknown }).code)
          : undefined;
      throw err;
    }

    const receipt = parseReceipt(
      res.headers.get("PAYMENT-RESPONSE") || res.headers.get("payment-response"),
    );
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return { ...(data as object), ...(receipt ? { $receipt: receipt } : {}) } as WithReceipt<T>;
    }
    return (receipt ? { data, $receipt: receipt } : data) as WithReceipt<T>;
  }

  call(path: string) {
    return this.get(path);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<WithReceipt<T>> {
    const url = path.startsWith("http") ? path : withHostPath(this.base, path);
    const init: RequestInit = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "milypay-sdk/0.2.0",
      },
      body: JSON.stringify(body ?? {}),
    };
    const res = this.x402
      ? await this.x402.fetch(url, init)
      : await this.fetcher(url, init);

    const text = await res.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* keep */
    }
    if (!res.ok) {
      const msg =
        typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : text.slice(0, 400);
      const err = new Error(`HTTP ${res.status}: ${msg}`) as Error & {
        status?: number;
        body?: unknown;
        code?: string;
      };
      err.status = res.status;
      err.body = data;
      err.code =
        typeof data === "object" && data && "code" in data
          ? String((data as { code: unknown }).code)
          : undefined;
      throw err;
    }

    const receipt = parseReceipt(
      res.headers.get("PAYMENT-RESPONSE") || res.headers.get("payment-response"),
    );
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return { ...(data as object), ...(receipt ? { $receipt: receipt } : {}) } as WithReceipt<T>;
    }
    return (receipt ? { data, $receipt: receipt } : data) as WithReceipt<T>;
  }

  business = {
    abn: (abn: string) => this.get(`/au-business/abn/${abn.replace(/\D/g, "")}`),
    acn: (acn: string) => this.get(`/au-business/acn/${acn.replace(/\D/g, "")}`),
    search: (name: string, maxResults?: number) => {
      const q = new URLSearchParams({ name });
      if (maxResults) q.set("maxResults", String(maxResults));
      return this.get(`/au-business/search?${q}`);
    },
  };

  company = {
    acn: (acn: string) => this.get(`/au-company/acn/${acn.replace(/\D/g, "")}`),
    search: (name: string, limit?: number) => {
      const q = new URLSearchParams({ name });
      if (limit) q.set("limit", String(limit));
      return this.get(`/au-company/search?${q}`);
    },
    report: (acn: string) =>
      this.get(`/au-company-report?acn=${acn.replace(/\D/g, "")}`),
  };

  address = {
    validate: (q: string) => this.get(`/au-address/validate?${new URLSearchParams({ q })}`),
    search: (q: string, limit?: number) => {
      const qs = new URLSearchParams({ q });
      if (limit) qs.set("limit", String(limit));
      return this.get(`/au-address/search?${qs}`);
    },
    geocode: (q: string) => this.get(`/au-address/geocode?${new URLSearchParams({ q })}`),
  };

  super = {
    abn: (abn: string) => this.get(`/au-super/abn/${abn.replace(/\D/g, "")}`),
  };

  weather(input: { q: string; days?: number } | { lat: number; lng: number; days?: number }) {
    const qs = new URLSearchParams();
    if ("q" in input) qs.set("q", input.q);
    else {
      qs.set("lat", String(input.lat));
      qs.set("lng", String(input.lng));
    }
    if (input.days != null) qs.set("days", String(input.days));
    return this.get(`/au-weather?${qs}`);
  }

  bsb = {
    lookup: (bsb: string) => {
      const d = bsb.replace(/\D/g, "");
      const formatted = `${d.slice(0, 3)}-${d.slice(3)}`;
      return this.get(`/au-bsb/${encodeURIComponent(formatted)}`);
    },
    search: (q: string, limit?: number) => {
      const qs = new URLSearchParams({ q });
      if (limit) qs.set("limit", String(limit));
      return this.get(`/au-bsb/search?${qs}`);
    },
  };

  abs = {
    dataflows: (q?: string, limit?: number) => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (limit) qs.set("limit", String(limit));
      const s = qs.toString();
      return this.get(`/au-abs/dataflows${s ? `?${s}` : ""}`);
    },
    dataflow: (id: string) => this.get(`/au-abs/dataflow/${encodeURIComponent(id)}`),
    data: (
      dataflow: string,
      opts?: { key?: string; startPeriod?: string; endPeriod?: string },
    ) => {
      const qs = new URLSearchParams();
      if (opts?.key) qs.set("key", opts.key);
      if (opts?.startPeriod) qs.set("startPeriod", opts.startPeriod);
      if (opts?.endPeriod) qs.set("endPeriod", opts.endPeriod);
      if (!opts?.key && !opts?.startPeriod) qs.set("startPeriod", "2020");
      const s = qs.toString();
      return this.get(`/au-abs/data/${encodeURIComponent(dataflow)}${s ? `?${s}` : ""}`);
    },
    cpi: (startPeriod?: string) =>
      this.get(
        `/au-abs/cpi${startPeriod ? `?startPeriod=${encodeURIComponent(startPeriod)}` : ""}`,
      ),
  };



  phone = {
    lookup: (number: string) =>
      this.get(`/au-phone?number=${encodeURIComponent(number)}`),
  };

  energy = {
    catalogue: () => this.get(`/au-energy`),
    nem: () => this.get(`/au-energy/nem`),
    nemRegion: (region: string) => this.get(`/au-energy/nem/${encodeURIComponent(region)}`),
    notices: (limit?: number) => {
      const q = limit != null ? `?limit=${limit}` : "";
      return this.get(`/au-energy/notices${q}`);
    },
  };

  transit = {
    regions: () => this.get(`/au-transit/regions`),
    vehicles: (region: string, opts?: { routeId?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (opts?.routeId) qs.set("routeId", opts.routeId);
      if (opts?.limit) qs.set("limit", String(opts.limit));
      const s = qs.toString();
      return this.get(`/au-transit/${encodeURIComponent(region)}/vehicles${s ? `?${s}` : ""}`);
    },
    tripUpdates: (
      region: string,
      opts?: { routeId?: string; stopId?: string; limit?: number },
    ) => {
      const qs = new URLSearchParams();
      if (opts?.routeId) qs.set("routeId", opts.routeId);
      if (opts?.stopId) qs.set("stopId", opts.stopId);
      if (opts?.limit) qs.set("limit", String(opts.limit));
      const s = qs.toString();
      return this.get(`/au-transit/${encodeURIComponent(region)}/trip-updates${s ? `?${s}` : ""}`);
    },
    alerts: (region: string, opts?: { routeId?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (opts?.routeId) qs.set("routeId", opts.routeId);
      if (opts?.limit) qs.set("limit", String(opts.limit));
      const s = qs.toString();
      return this.get(`/au-transit/${encodeURIComponent(region)}/alerts${s ? `?${s}` : ""}`);
    },
    summary: (region: string) => this.get(`/au-transit/${encodeURIComponent(region)}/summary`),
  };

  postage(input: {
    weight: number;
    from?: string;
    to?: string;
    country?: string;
    length?: number;
    width?: number;
    height?: number;
  }) {
    const qs = new URLSearchParams({ weight: String(input.weight) });
    for (const k of ["from", "to", "country", "length", "width", "height"] as const) {
      const v = input[k];
      if (v != null) qs.set(k, String(v));
    }
    return this.get(`/au-postage?${qs}`);
  }

  domains = {
    check: (name: string) =>
      this.get(`/domains/check?name=${encodeURIComponent(name)}`),
    quote: (name: string, years = 1) =>
      this.get(
        `/domains/quote?name=${encodeURIComponent(name)}&years=${encodeURIComponent(String(years))}`,
      ),
  };

  rides = {
    quote: (input: {
      startLat: number;
      startLng: number;
      endLat: number;
      endLng: number;
      seatCount?: number;
    }) => {
      const qs = new URLSearchParams({
        start_lat: String(input.startLat),
        start_lng: String(input.startLng),
        end_lat: String(input.endLat),
        end_lng: String(input.endLng),
      });
      if (input.seatCount) qs.set("seat_count", String(input.seatCount));
      return this.get(`/au-rides/quote?${qs}`);
    },
    eta: (input: { startLat: number; startLng: number; productId?: string }) => {
      const qs = new URLSearchParams({
        start_lat: String(input.startLat),
        start_lng: String(input.startLng),
      });
      if (input.productId) qs.set("product_id", input.productId);
      return this.get(`/au-rides/eta?${qs}`);
    },
    products: (lat: number, lng: number) =>
      this.get(
        `/au-rides/products?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
      ),
  };

  check = {
    catalogue: () => this.get(`/au-check`),
    postcode: (postcode: string, country?: string) =>
      this.get(`/au-check/postcode?postcode=${encodeURIComponent(postcode)}${country ? `&country=${encodeURIComponent(country)}` : ""}`),
    reverse: (lat: number, lng: number) =>
      this.get(`/au-check/reverse?lat=${lat}&lng=${lng}`),
    suburb: (q: string) => this.get(`/au-check/suburb?q=${encodeURIComponent(q)}`),
    activity: (q: string) => this.get(`/au-check/activity?q=${encodeURIComponent(q)}`),
    companyName: (name: string) =>
      this.get(`/au-check/company-name?name=${encodeURIComponent(name)}`),
    businessName: (name: string) =>
      this.get(`/au-check/business-name?name=${encodeURIComponent(name)}`),
    sanctions: (name: string) =>
      this.get(`/au-check/sanctions?name=${encodeURIComponent(name)}`),
    directorId: (id: string) =>
      this.get(`/au-check/director-id?id=${encodeURIComponent(id)}`),
    tfn: (tfn: string) => this.get(`/au-check/tfn?tfn=${encodeURIComponent(tfn)}`),
    email: (email: string) =>
      this.get(`/au-check/email?email=${encodeURIComponent(email)}`),
  };

  /** MoneyGram pre-fund (does not settle x402). */
  ramp = {
    moneygram: () => this.get(`/ramp/moneygram`),
    session: (mode: "on-ramp" | "off-ramp" = "on-ramp") =>
      this.post(`/ramp/moneygram/session`, { mode }),
  };
}

export default Milypay;
