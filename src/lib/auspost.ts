// Australia Post client.
// - Postage (PAC, Postage Assessment Calculator): AUTH-KEY header. Config: AUSPOST_PAC_KEY.
// - Tracking (Shipping & Tracking API): Basic auth + Account-Number header.
//   Config: AUSPOST_API_KEY, AUSPOST_API_PASSWORD, AUSPOST_ACCOUNT.
// Register at https://developers.auspost.com.au

const BASE = "https://digitalapi.auspost.com.au";

async function pac<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.AUSPOST_PAC_KEY;
  if (!key) throw new Error("AUSPOST_PAC_KEY is not configured");
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { "AUTH-KEY": key } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AusPost ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

interface PacServiceRaw {
  code?: string;
  name?: string;
  price?: string;
  delivery_time?: string;
  options?: { option?: { code?: string; name?: string }[] | { code?: string; name?: string } };
}
interface PacResponse {
  services?: { service?: PacServiceRaw[] | PacServiceRaw };
}

function asArray<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

export interface PostageService {
  code: string;
  name: string;
  price: number;
  deliveryTime: string | null;
}

function normaliseServices(raw: PacResponse): PostageService[] {
  return asArray(raw.services?.service).map((s) => ({
    code: s.code || "",
    name: s.name || "",
    price: s.price ? Number(s.price) : 0,
    deliveryTime: s.delivery_time || null,
  }));
}

export async function domesticParcelPostage(args: {
  from: string;
  to: string;
  weight: string;
  length?: string;
  width?: string;
  height?: string;
}): Promise<{ from: string; to: string; services: PostageService[] } | { error: string }> {
  if (!/^\d{4}$/.test(args.from) || !/^\d{4}$/.test(args.to)) {
    return { error: "from and to must be 4-digit postcodes" };
  }
  const params: Record<string, string> = {
    from_postcode: args.from,
    to_postcode: args.to,
    weight: args.weight,
  };
  if (args.length) params.length = args.length;
  if (args.width) params.width = args.width;
  if (args.height) params.height = args.height;
  const raw = await pac<PacResponse>("postage/parcel/domestic/service.json", params);
  return { from: args.from, to: args.to, services: normaliseServices(raw) };
}

export async function internationalParcelPostage(args: {
  country: string;
  weight: string;
}): Promise<{ country: string; services: PostageService[] } | { error: string }> {
  if (!/^[A-Za-z]{2}$/.test(args.country)) return { error: "country must be a 2-letter code" };
  const raw = await pac<PacResponse>("postage/parcel/international/service.json", {
    country_code: args.country.toUpperCase(),
    weight: args.weight,
  });
  return { country: args.country.toUpperCase(), services: normaliseServices(raw) };
}

// ---- Tracking (Shipping & Tracking API) ----

interface TrackEvent {
  description?: string;
  location?: string;
  date?: string;
}
interface TrackResultRaw {
  tracking_id?: string;
  status?: string;
  trackable_items?: {
    article_id?: string;
    product_type?: string;
    items?: unknown;
    events?: TrackEvent[];
  }[];
}

export async function trackParcel(
  id: string,
): Promise<
  | { trackingId: string; status: string; events: { description: string; location: string | null; date: string | null }[] }
  | { error: string }
> {
  const key = process.env.AUSPOST_API_KEY;
  const pass = process.env.AUSPOST_API_PASSWORD;
  const account = process.env.AUSPOST_ACCOUNT;
  if (!key || !account) throw new Error("AUSPOST_API_KEY / AUSPOST_ACCOUNT not configured");
  const clean = id.trim();
  if (!clean) return { error: "tracking id required" };

  const res = await fetch(`${BASE}/shipping/v1/track?tracking_ids=${encodeURIComponent(clean)}`, {
    headers: {
      Authorization: `Basic ${btoa(`${key}:${pass || ""}`)}`,
      "Account-Number": account,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AusPost track ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { tracking_results?: TrackResultRaw[] };
  const r = data.tracking_results?.[0];
  if (!r) return { error: "Tracking number not found" };
  const events = (r.trackable_items?.[0]?.events || []).map((e) => ({
    description: e.description || "",
    location: e.location || null,
    date: e.date || null,
  }));
  return { trackingId: r.tracking_id || clean, status: r.status || "Unknown", events };
}
