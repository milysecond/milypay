/**
 * Uber Rides — quote only (price / time / products).
 * No ride requests, no booking, no rider PII beyond coordinates.
 *
 * Auth: OAuth2 client_credentials scope ride_request.estimate
 * Env: UBER_CLIENT_ID, UBER_CLIENT_SECRET
 * Optional: UBER_TOKEN_URL (default https://auth.uber.com/oauth/v2/token)
 *           UBER_API_BASE (default https://api.uber.com)
 *
 * @see https://developer.uber.com/docs/riders/references/api/v1.2/estimates-price-get
 */

const TOKEN_URL = process.env.UBER_TOKEN_URL || "https://auth.uber.com/oauth/v2/token";
const API_BASE = process.env.UBER_API_BASE || "https://api.uber.com";
const UA = "Milypay/1.0 (+https://milypay.xyz; Uber rides quote proxy)";

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export function uberConfigured(): boolean {
  return Boolean(process.env.UBER_CLIENT_ID && process.env.UBER_CLIENT_SECRET);
}

export function listRideProducts() {
  return {
    brand: "Milypay",
    service: "au-rides",
    mode: "quote_only",
    note: "Price and time estimates only. No ride booking.",
    configured: uberConfigured(),
    network: "Uber Rides API v1.2",
    endpoints: [
      {
        path: "/au-rides",
        method: "GET",
        price: "0.001",
        description: "Catalogue",
      },
      {
        path: "/au-rides/quote",
        method: "GET",
        price: "0.01",
        description: "Price estimates start→end (lat/lng)",
        query: ["start_lat", "start_lng", "end_lat", "end_lng", "seat_count?"],
      },
      {
        path: "/au-rides/eta",
        method: "GET",
        price: "0.01",
        description: "Pickup time estimates at start",
        query: ["start_lat", "start_lng", "product_id?"],
      },
      {
        path: "/au-rides/products",
        method: "GET",
        price: "0.005",
        description: "Products available at location",
        query: ["lat", "lng"],
      },
    ],
    docs: "https://milypay.xyz/agents.md",
    upstream: "https://developer.uber.com/docs/riders",
  };
}

async function getAccessToken(): Promise<string> {
  if (!uberConfigured()) {
    throw Object.assign(new Error("Uber API not configured"), { code: "not_configured", status: 503 });
  }
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    client_id: process.env.UBER_CLIENT_ID!,
    client_secret: process.env.UBER_CLIENT_SECRET!,
    grant_type: "client_credentials",
    scope: "ride_request.estimate",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
      "user-agent": UA,
    },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw Object.assign(
      new Error(data.error_description || data.error || `Uber token HTTP ${res.status}`),
      { code: "uber_auth_failed", status: 502, upstreamStatus: res.status },
    );
  }
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 2592000;
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + expiresIn * 1000,
  };
  return data.access_token;
}

async function uberGet(path: string, query: Record<string, string | number | undefined>) {
  const token = await getAccessToken();
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      "accept-language": "en_AU",
      "user-agent": UA,
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  if (!res.ok) {
    let msg = `Uber API HTTP ${res.status}`;
    if (json && typeof json === "object") {
      const o = json as Record<string, unknown>;
      if (typeof o.message === "string") msg = o.message;
      else if (typeof o.error === "string") msg = o.error;
    }
    throw Object.assign(new Error(msg), {
      code: "uber_upstream",
      status: res.status >= 500 ? 502 : res.status === 401 || res.status === 403 ? 502 : 400,
      upstreamStatus: res.status,
      upstream: json,
    });
  }
  return json;
}

function parseCoord(v: string | null, name: string): number {
  if (v == null || v === "") {
    throw Object.assign(new Error(`Missing ${name}`), { code: "bad_request", status: 400 });
  }
  const n = Number(v);
  if (!Number.isFinite(n) || Math.abs(n) > 180) {
    throw Object.assign(new Error(`Invalid ${name}`), { code: "bad_request", status: 400 });
  }
  return n;
}

export type PriceEstimate = {
  productId?: string;
  displayName?: string;
  currencyCode?: string;
  estimate?: string;
  lowEstimate?: number | null;
  highEstimate?: number | null;
  surgeMultiplier?: number;
  duration?: number | null;
  distance?: number | null;
  localizedDisplayName?: string;
};

export type QuoteResult = {
  brand: "Milypay";
  service: "au-rides/quote";
  mode: "quote_only";
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  seatCount?: number;
  currencyHint: string;
  prices: PriceEstimate[];
  source: "uber";
  fetchedAt: string;
};

export async function quoteRide(params: {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  seatCount?: number;
}): Promise<QuoteResult> {
  const raw = (await uberGet("/v1.2/estimates/price", {
    start_latitude: params.startLat,
    start_longitude: params.startLng,
    end_latitude: params.endLat,
    end_longitude: params.endLng,
    seat_count: params.seatCount,
  })) as { prices?: Array<Record<string, unknown>> };

  const prices: PriceEstimate[] = (raw.prices || []).map((p) => ({
    productId: typeof p.product_id === "string" ? p.product_id : undefined,
    displayName: typeof p.display_name === "string" ? p.display_name : undefined,
    localizedDisplayName:
      typeof p.localized_display_name === "string" ? p.localized_display_name : undefined,
    currencyCode: typeof p.currency_code === "string" ? p.currency_code : undefined,
    estimate: typeof p.estimate === "string" ? p.estimate : undefined,
    lowEstimate: typeof p.low_estimate === "number" ? p.low_estimate : p.low_estimate == null ? null : undefined,
    highEstimate: typeof p.high_estimate === "number" ? p.high_estimate : p.high_estimate == null ? null : undefined,
    surgeMultiplier: typeof p.surge_multiplier === "number" ? p.surge_multiplier : undefined,
    duration: typeof p.duration === "number" ? p.duration : null,
    distance: typeof p.distance === "number" ? p.distance : null,
  }));

  return {
    brand: "Milypay",
    service: "au-rides/quote",
    mode: "quote_only",
    start: { lat: params.startLat, lng: params.startLng },
    end: { lat: params.endLat, lng: params.endLng },
    seatCount: params.seatCount,
    currencyHint: prices[0]?.currencyCode || "local",
    prices,
    source: "uber",
    fetchedAt: new Date().toISOString(),
  };
}

export type EtaResult = {
  brand: "Milypay";
  service: "au-rides/eta";
  mode: "quote_only";
  start: { lat: number; lng: number };
  times: Array<{
    productId?: string;
    displayName?: string;
    estimateSeconds?: number | null;
  }>;
  source: "uber";
  fetchedAt: string;
};

export async function etaRide(params: {
  startLat: number;
  startLng: number;
  productId?: string;
}): Promise<EtaResult> {
  const raw = (await uberGet("/v1.2/estimates/time", {
    start_latitude: params.startLat,
    start_longitude: params.startLng,
    product_id: params.productId,
  })) as { times?: Array<Record<string, unknown>> };

  return {
    brand: "Milypay",
    service: "au-rides/eta",
    mode: "quote_only",
    start: { lat: params.startLat, lng: params.startLng },
    times: (raw.times || []).map((t) => ({
      productId: typeof t.product_id === "string" ? t.product_id : undefined,
      displayName: typeof t.display_name === "string" ? t.display_name : undefined,
      estimateSeconds: typeof t.estimate === "number" ? t.estimate : null,
    })),
    source: "uber",
    fetchedAt: new Date().toISOString(),
  };
}

export type ProductsResult = {
  brand: "Milypay";
  service: "au-rides/products";
  mode: "quote_only";
  location: { lat: number; lng: number };
  products: Array<{
    productId?: string;
    displayName?: string;
    description?: string;
    capacity?: number;
    image?: string;
    shared?: boolean;
  }>;
  source: "uber";
  fetchedAt: string;
};

export async function productsAt(params: { lat: number; lng: number }): Promise<ProductsResult> {
  const raw = (await uberGet("/v1.2/products", {
    latitude: params.lat,
    longitude: params.lng,
  })) as { products?: Array<Record<string, unknown>> };

  return {
    brand: "Milypay",
    service: "au-rides/products",
    mode: "quote_only",
    location: { lat: params.lat, lng: params.lng },
    products: (raw.products || []).map((p) => ({
      productId: typeof p.product_id === "string" ? p.product_id : undefined,
      displayName: typeof p.display_name === "string" ? p.display_name : undefined,
      description: typeof p.description === "string" ? p.description : undefined,
      capacity: typeof p.capacity === "number" ? p.capacity : undefined,
      image: typeof p.image === "string" ? p.image : undefined,
      shared: typeof p.shared === "boolean" ? p.shared : undefined,
    })),
    source: "uber",
    fetchedAt: new Date().toISOString(),
  };
}

export function parseQuoteQuery(url: URL) {
  return {
    startLat: parseCoord(url.searchParams.get("start_lat"), "start_lat"),
    startLng: parseCoord(url.searchParams.get("start_lng"), "start_lng"),
    endLat: parseCoord(url.searchParams.get("end_lat"), "end_lat"),
    endLng: parseCoord(url.searchParams.get("end_lng"), "end_lng"),
    seatCount: url.searchParams.get("seat_count")
      ? Number(url.searchParams.get("seat_count"))
      : undefined,
  };
}

export function parseEtaQuery(url: URL) {
  return {
    startLat: parseCoord(url.searchParams.get("start_lat"), "start_lat"),
    startLng: parseCoord(url.searchParams.get("start_lng"), "start_lng"),
    productId: url.searchParams.get("product_id") || undefined,
  };
}

export function parseProductsQuery(url: URL) {
  return {
    lat: parseCoord(url.searchParams.get("lat"), "lat"),
    lng: parseCoord(url.searchParams.get("lng"), "lng"),
  };
}

export function errorToResponse(e: unknown): { status: number; body: Record<string, unknown> } {
  const err = e as {
    message?: string;
    code?: string;
    status?: number;
    upstreamStatus?: number;
    upstream?: unknown;
  };
  const status = typeof err.status === "number" ? err.status : 500;
  return {
    status,
    body: {
      error: err.message || "Uber rides error",
      code: err.code || "rides_error",
      brand: "Milypay",
      mode: "quote_only",
      configured: uberConfigured(),
      upstreamStatus: err.upstreamStatus,
      docs: "https://milypay.xyz/agents.md",
      setup:
        err.code === "not_configured"
          ? "Set Worker secrets UBER_CLIENT_ID and UBER_CLIENT_SECRET (scope ride_request.estimate). Create app at https://developer.uber.com/dashboard"
          : undefined,
    },
  };
}
