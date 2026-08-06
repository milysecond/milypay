/**
 * Australian public transport — GTFS-Realtime.
 *
 * Live:
 *   seq — Translink SEQ (QLD) — open
 *   sa  — Adelaide Metro — open (may be blocked from some edges)
 *   vic — Transport Victoria — KeyId header (VIC_GTFS_KEY_ID)
 *   nsw — Transport for NSW — Authorization: apikey (TFNSW_API_KEY)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const GtfsRealtimeBindings = require("gtfs-realtime-bindings") as {
  transit_realtime: {
    FeedMessage: {
      decode: (buf: Uint8Array) => GtfsFeed;
    };
  };
};

type Longish = { toNumber?: () => number; toString?: () => string } | number | string | null | undefined;

type GtfsFeed = {
  header?: { timestamp?: Longish; gtfsRealtimeVersion?: string };
  entity?: GtfsEntity[];
};

type GtfsEntity = {
  id?: string;
  vehicle?: {
    trip?: { tripId?: string; routeId?: string; directionId?: number; startTime?: string; startDate?: string };
    position?: { latitude?: number; longitude?: number; bearing?: number; speed?: number };
    timestamp?: Longish;
    vehicle?: { id?: string; label?: string; licensePlate?: string };
    currentStatus?: number | string;
    stopId?: string;
    currentStopSequence?: number;
  };
  tripUpdate?: {
    trip?: { tripId?: string; routeId?: string; directionId?: number; startTime?: string; startDate?: string };
    stopTimeUpdate?: {
      stopSequence?: number;
      stopId?: string;
      arrival?: { delay?: number; time?: Longish };
      departure?: { delay?: number; time?: Longish };
      scheduleRelationship?: number | string;
    }[];
    vehicle?: { id?: string; label?: string };
    timestamp?: Longish;
  };
  alert?: {
    headerText?: { translation?: { text?: string; language?: string }[] };
    descriptionText?: { translation?: { text?: string; language?: string }[] };
    informedEntity?: { agencyId?: string; routeId?: string; trip?: { tripId?: string }; stopId?: string }[];
    activePeriod?: { start?: Longish; end?: Longish }[];
    cause?: number | string;
    effect?: number | string;
  };
};

export type TransitRegionId = "seq" | "sa" | "vic" | "nsw";
export type VicMode = "metro" | "tram" | "bus" | "vline";
export type NswMode =
  | "buses"
  | "sydneytrains"
  | "metro"
  | "nswtrains"
  | "ferries"
  | "lightrail";

type FeedSet = { vehicles: string; tripUpdates: string; alerts: string };

export type TransitRegion = {
  id: TransitRegionId;
  name: string;
  state: string;
  operator: string;
  /** Single feed set (seq/sa) */
  feeds?: FeedSet;
  /** Mode-split feeds (vic / nsw) */
  modes?: Record<string, FeedSet>;
  defaultMode?: string;
  modeList?: string[];
  attribution: string;
  status: "live" | "key_required";
  auth?: "vic_keyid" | "tfnsw_apikey";
  keySignup?: string;
};

const VIC_BASE = "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1";

function vicFeeds(mode: VicMode): FeedSet {
  const base = `${VIC_BASE}/${mode}`;
  return {
    vehicles: `${base}/vehicle-positions`,
    tripUpdates: `${base}/trip-updates`,
    alerts: `${base}/service-alerts`,
  };
}

export const REGIONS: TransitRegion[] = [
  {
    id: "seq",
    name: "South East Queensland",
    state: "QLD",
    operator: "Translink",
    feeds: {
      vehicles: "https://gtfsrt.api.translink.com.au/api/realtime/SEQ/VehiclePositions",
      tripUpdates: "https://gtfsrt.api.translink.com.au/api/realtime/SEQ/TripUpdates",
      alerts: "https://gtfsrt.api.translink.com.au/api/realtime/SEQ/Alerts",
    },
    attribution: "Source: Translink (Queensland Government) GTFS-Realtime open feeds.",
    status: "live",
  },
  {
    id: "sa",
    name: "Adelaide Metro",
    state: "SA",
    operator: "Adelaide Metro",
    feeds: {
      vehicles: "https://gtfs.adelaidemetro.com.au/v1/realtime/vehicle_positions",
      tripUpdates: "https://gtfs.adelaidemetro.com.au/v1/realtime/trip_updates",
      alerts: "https://gtfs.adelaidemetro.com.au/v1/realtime/service_alerts",
    },
    attribution: "Source: Adelaide Metro GTFS-Realtime open feeds.",
    status: "live",
  },
  {
    id: "vic",
    name: "Victoria",
    state: "VIC",
    operator: "Transport Victoria / PTV",
    defaultMode: "metro",
    modeList: ["metro", "tram", "bus", "vline"],
    modes: {
      metro: vicFeeds("metro"),
      tram: vicFeeds("tram"),
      bus: {
        vehicles: `${VIC_BASE}/bus/vehicle-positions`,
        tripUpdates: `${VIC_BASE}/bus/trip-updates`,
        // Bus openapi has no service-alerts feed — reuse metro network alerts
        alerts: `${VIC_BASE}/metro/service-alerts`,
      },
      vline: {
        vehicles: `${VIC_BASE}/vline/vehicle-positions`,
        tripUpdates: `${VIC_BASE}/vline/trip-updates`,
        alerts: `${VIC_BASE}/metro/service-alerts`,
      },
    },
    attribution:
      "Source: Department of Transport and Planning Victoria GTFS-Realtime (opendata.transport.vic.gov.au).",
    status: "live",
    auth: "vic_keyid",
    keySignup: "https://opendata.transport.vic.gov.au/user/me/api-tokens",
  },
  {
    id: "nsw",
    name: "New South Wales",
    state: "NSW",
    operator: "Transport for NSW",
    defaultMode: "buses",
    modeList: ["buses", "sydneytrains", "metro", "nswtrains", "ferries", "lightrail"],
    modes: {
      buses: {
        vehicles: "https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/buses",
        tripUpdates: "https://api.transport.nsw.gov.au/v1/gtfs/realtime/buses",
        alerts: "",
      },
      sydneytrains: {
        vehicles: "https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/sydneytrains",
        tripUpdates: "https://api.transport.nsw.gov.au/v2/gtfs/realtime/sydneytrains",
        alerts: "",
      },
      metro: {
        vehicles: "https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/metro",
        tripUpdates: "https://api.transport.nsw.gov.au/v1/gtfs/realtime/metro",
        alerts: "",
      },
      nswtrains: {
        vehicles: "https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/nswtrains",
        tripUpdates: "https://api.transport.nsw.gov.au/v1/gtfs/realtime/nswtrains",
        alerts: "",
      },
      ferries: {
        vehicles: "https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/ferries/sydneyferries",
        tripUpdates: "https://api.transport.nsw.gov.au/v1/gtfs/realtime/ferries/sydneyferries",
        alerts: "",
      },
      lightrail: {
        vehicles: "https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/lightrail/cbdandsoutheast",
        tripUpdates: "https://api.transport.nsw.gov.au/v1/gtfs/realtime/lightrail/cbdandsoutheast",
        alerts: "",
      },
    },
    attribution: "Source: Transport for NSW Open Data GTFS-Realtime (api.transport.nsw.gov.au).",
    status: "live",
    auth: "tfnsw_apikey",
    keySignup: "https://opendata.transport.nsw.gov.au/data/user/register",
  },
];

export const PLANNED_REGIONS: { id: string; name: string; state: string; operator: string; status: "key_required"; keySignup?: string; portal?: string; notes?: string }[] = [];

const UA = "Milypay/1.0 (+https://milypay.xyz; GTFS-RT proxy)";

function longToNumber(v: Longish): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v.toNumber === "function") return v.toNumber();
  if (typeof v.toString === "function") {
    const n = Number(v.toString());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function textFromTranslated(
  field?: { translation?: { text?: string; language?: string }[] },
): string | null {
  const t = field?.translation;
  if (!t?.length) return null;
  const en = t.find((x) => (x.language || "").toLowerCase().startsWith("en"));
  return (en || t[0])?.text || null;
}

export function getRegion(id: string): TransitRegion | null {
  const key = id.trim().toLowerCase();
  return REGIONS.find((r) => r.id === key) || null;
}

export function listRegions() {
  const vicReady = Boolean(process.env.VIC_GTFS_KEY_ID?.trim());
  const nswReady = Boolean(process.env.TFNSW_API_KEY?.trim());
  return {
    live: REGIONS.filter((r) => {
      if (r.id === "vic") return vicReady;
      if (r.id === "nsw") return nswReady;
      return true;
    }).map(({ feeds: _f, modes: _m, ...r }) => ({
      ...r,
      modes: r.modeList || (r.id === "vic" ? (["metro", "tram", "bus", "vline"] as string[]) : undefined),
      keyConfigured:
        r.auth === "vic_keyid" ? vicReady : r.auth === "tfnsw_apikey" ? nswReady : true,
    })),
    planned: [
      ...PLANNED_REGIONS,
      ...(!vicReady
        ? [
            {
              id: "vic",
              name: "Victoria",
              state: "VIC",
              operator: "Transport Victoria",
              status: "key_required" as const,
              keySignup: "https://opendata.transport.vic.gov.au/",
              notes: "Set VIC_GTFS_KEY_ID (portal odata KeyId UUID).",
            },
          ]
        : []),
      ...(!nswReady
        ? [
            {
              id: "nsw",
              name: "New South Wales",
              state: "NSW",
              operator: "Transport for NSW",
              status: "key_required" as const,
              keySignup: "https://opendata.transport.nsw.gov.au/data/user/register",
              notes: "Set TFNSW_API_KEY (Authorization: apikey …).",
            },
          ]
        : []),
    ],
    attribution:
      "GTFS-Realtime from Australian open data. Live: QLD SEQ, SA, VIC (KeyId), NSW (apikey).",
  };
}

function authHeaders(region: TransitRegion): Record<string, string> {
  if (region.auth === "vic_keyid") {
    const key = process.env.VIC_GTFS_KEY_ID?.trim();
    if (!key) {
      throw new Error(
        "VIC_GTFS_KEY_ID not configured. Create an API token at https://opendata.transport.vic.gov.au/ and use the odata KeyId (UUID), not the JWT.",
      );
    }
    return { KeyId: key };
  }
  if (region.auth === "tfnsw_apikey") {
    const key = process.env.TFNSW_API_KEY?.trim();
    if (!key) {
      throw new Error(
        "TFNSW_API_KEY not configured. Register at https://opendata.transport.nsw.gov.au/ and create an application API key.",
      );
    }
    return { Authorization: `apikey ${key}` };
  }
  return {};
}

function resolveFeedUrls(
  region: TransitRegion,
  mode?: string,
): { urls: FeedSet; modeLabel: string } {
  if (region.feeds) {
    return { urls: region.feeds, modeLabel: "all" };
  }
  if (region.modes) {
    const m = (mode || region.defaultMode || "metro").toLowerCase();
    if (!region.modes[m]) {
      const allowed = Object.keys(region.modes).join("|");
      throw new Error(`Unknown mode '${mode}' for ${region.id}. Use ${allowed}`);
    }
    return { urls: region.modes[m], modeLabel: m };
  }
  throw new Error(`Region ${region.id} has no feeds configured`);
}

async function fetchFeed(url: string, extraHeaders: Record<string, string> = {}): Promise<GtfsFeed> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/x-protobuf, application/octet-stream, */*",
      "Accept-Encoding": "identity",
      ...extraHeaders,
    },
    signal: AbortSignal.timeout(20_000),
    redirect: "follow",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upstream GTFS-RT failed (${res.status}) ${url}: ${t.slice(0, 160)}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length < 4) {
    throw new Error(`Empty GTFS-RT body from ${url}`);
  }
  if (buf[0] === 0x3c /* < */ || buf[0] === 0x7b /* { */) {
    const head = new TextDecoder().decode(buf.slice(0, 120));
    throw new Error(`Upstream returned non-protobuf body from ${url}: ${head}`);
  }
  try {
    return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "decode failed";
    throw new Error(`GTFS-RT decode failed for ${url} (${buf.length} bytes): ${msg}`);
  }
}

function matchRoute(routeId: string | undefined, filter?: string): boolean {
  if (!filter) return true;
  if (!routeId) return false;
  return routeId.toLowerCase().includes(filter.toLowerCase());
}

function matchStop(stopId: string | undefined, filter?: string): boolean {
  if (!filter) return true;
  if (!stopId) return false;
  return stopId.toLowerCase().includes(filter.toLowerCase());
}

export async function getVehicles(
  regionId: string,
  opts?: { limit?: number; routeId?: string; mode?: string },
) {
  const region = getRegion(regionId);
  if (!region) throw new Error(`Unknown region '${regionId}'. Use seq, sa, vic, or nsw.`);
  const { urls, modeLabel } = resolveFeedUrls(region, opts?.mode);
  const feed = await fetchFeed(urls.vehicles, authHeaders(region));
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
  const vehicles = [];
  for (const e of feed.entity || []) {
    const v = e.vehicle;
    if (!v?.position) continue;
    if (!matchRoute(v.trip?.routeId, opts?.routeId)) continue;
    vehicles.push({
      id: e.id || v.vehicle?.id || null,
      tripId: v.trip?.tripId || null,
      routeId: v.trip?.routeId || null,
      directionId: v.trip?.directionId ?? null,
      lat: v.position.latitude ?? null,
      lon: v.position.longitude ?? null,
      bearing: v.position.bearing ?? null,
      speedMps: v.position.speed ?? null,
      stopId: v.stopId || null,
      label: v.vehicle?.label || v.vehicle?.id || null,
      timestamp: longToNumber(v.timestamp),
      mode: modeLabel === "all" ? undefined : modeLabel,
    });
    if (vehicles.length >= limit) break;
  }
  return {
    region: region.id,
    mode: modeLabel,
    type: "vehicles" as const,
    count: vehicles.length,
    feedTimestamp: longToNumber(feed.header?.timestamp),
    vehicles,
    attribution: region.attribution,
  };
}

export async function getTripUpdates(
  regionId: string,
  opts?: { limit?: number; routeId?: string; stopId?: string; mode?: string },
) {
  const region = getRegion(regionId);
  if (!region) throw new Error(`Unknown region '${regionId}'. Use seq, sa, vic, or nsw.`);
  const { urls, modeLabel } = resolveFeedUrls(region, opts?.mode);
  const feed = await fetchFeed(urls.tripUpdates, authHeaders(region));
  const limit = Math.min(Math.max(opts?.limit ?? 40, 1), 150);
  const updates = [];
  for (const e of feed.entity || []) {
    const tu = e.tripUpdate;
    if (!tu) continue;
    if (!matchRoute(tu.trip?.routeId, opts?.routeId)) continue;
    const stops = (tu.stopTimeUpdate || [])
      .filter((s) => matchStop(s.stopId, opts?.stopId))
      .slice(0, 12)
      .map((s) => ({
        stopId: s.stopId || null,
        stopSequence: s.stopSequence ?? null,
        arrivalDelaySec: s.arrival?.delay ?? null,
        arrivalTime: longToNumber(s.arrival?.time),
        departureDelaySec: s.departure?.delay ?? null,
        departureTime: longToNumber(s.departure?.time),
      }));
    if (opts?.stopId && stops.length === 0) continue;
    updates.push({
      id: e.id || null,
      tripId: tu.trip?.tripId || null,
      routeId: tu.trip?.routeId || null,
      directionId: tu.trip?.directionId ?? null,
      vehicleLabel: tu.vehicle?.label || tu.vehicle?.id || null,
      timestamp: longToNumber(tu.timestamp),
      stopTimeUpdates: stops,
      mode: modeLabel === "all" ? undefined : modeLabel,
    });
    if (updates.length >= limit) break;
  }
  return {
    region: region.id,
    mode: modeLabel,
    type: "trip_updates" as const,
    count: updates.length,
    feedTimestamp: longToNumber(feed.header?.timestamp),
    tripUpdates: updates,
    attribution: region.attribution,
  };
}

export async function getAlerts(
  regionId: string,
  opts?: { limit?: number; routeId?: string; mode?: string },
) {
  const region = getRegion(regionId);
  if (!region) throw new Error(`Unknown region '${regionId}'. Use seq, sa, vic, or nsw.`);
  const { urls, modeLabel } = resolveFeedUrls(region, opts?.mode);
  if (!urls.alerts) {
    return {
      region: region.id,
      mode: modeLabel,
      type: "alerts" as const,
      count: 0,
      feedTimestamp: null,
      alerts: [],
      note: "No alerts feed for this mode/region (or not entitled on this API key).",
      attribution: region.attribution,
    };
  }
  const feed = await fetchFeed(urls.alerts, authHeaders(region));
  const limit = Math.min(Math.max(opts?.limit ?? 30, 1), 100);
  const alerts = [];
  for (const e of feed.entity || []) {
    const a = e.alert;
    if (!a) continue;
    const informed = a.informedEntity || [];
    if (opts?.routeId) {
      const hit = informed.some((i) => matchRoute(i.routeId, opts.routeId));
      if (!hit) continue;
    }
    alerts.push({
      id: e.id || null,
      header: textFromTranslated(a.headerText),
      description: textFromTranslated(a.descriptionText),
      cause: a.cause ?? null,
      effect: a.effect ?? null,
      routes: informed.map((i) => i.routeId).filter(Boolean),
      stops: informed.map((i) => i.stopId).filter(Boolean),
      activePeriod: (a.activePeriod || []).map((p) => ({
        start: longToNumber(p.start),
        end: longToNumber(p.end),
      })),
      mode: modeLabel === "all" ? undefined : modeLabel,
    });
    if (alerts.length >= limit) break;
  }
  return {
    region: region.id,
    mode: modeLabel,
    type: "alerts" as const,
    count: alerts.length,
    feedTimestamp: longToNumber(feed.header?.timestamp),
    alerts,
    attribution: region.attribution,
  };
}

export async function getSummary(regionId: string, opts?: { mode?: string }) {
  const region = getRegion(regionId);
  if (!region) throw new Error(`Unknown region '${regionId}'. Use seq, sa, vic, or nsw.`);

  // mode=all fans out to each mode without recursive typing issues
  if ((opts?.mode || "").toLowerCase() === "all" && region.modes) {
    const modes = Object.keys(region.modes);
    const parts: {
      mode: string;
      ok: boolean;
      vehicles?: number;
      tripUpdates?: number;
      alerts?: number;
      error?: string;
    }[] = [];
    for (const m of modes) {
      try {
        const s = await getSummarySingle(region, m);
        parts.push({
          mode: m,
          ok: true,
          vehicles: s.vehicles,
          tripUpdates: s.tripUpdates,
          alerts: s.alerts,
        });
      } catch (e) {
        parts.push({
          mode: m,
          ok: false,
          error: e instanceof Error ? e.message : "failed",
        });
      }
    }
    return {
      region: region.id,
      mode: "all",
      modes: parts,
      attribution: region.attribution,
    };
  }

  return getSummarySingle(region, opts?.mode);
}

async function getSummarySingle(region: TransitRegion, mode?: string) {
  const { urls, modeLabel } = resolveFeedUrls(region, mode);
  const headers = authHeaders(region);
  const emptyFeed: GtfsFeed = { entity: [], header: {} };
  const results = await Promise.allSettled([
    fetchFeed(urls.vehicles, headers),
    fetchFeed(urls.tripUpdates, headers),
    urls.alerts ? fetchFeed(urls.alerts, headers) : Promise.resolve(emptyFeed),
  ]);
  const vFeed: GtfsFeed =
    results[0].status === "fulfilled" ? results[0].value : emptyFeed;
  const tFeed: GtfsFeed =
    results[1].status === "fulfilled" ? results[1].value : emptyFeed;
  const aFeed: GtfsFeed =
    results[2].status === "fulfilled" ? results[2].value : emptyFeed;
  if (results[0].status === "rejected" && results[1].status === "rejected") {
    throw results[0].reason instanceof Error
      ? results[0].reason
      : new Error("vehicles and trip-updates failed");
  }
  const vehicleEntities = (vFeed.entity || []).filter((e) => e.vehicle);
  const tripEntities = (tFeed.entity || []).filter((e) => e.tripUpdate);
  const alertEntities = (aFeed.entity || []).filter((e) => e.alert);
  const v0 = vehicleEntities[0]?.vehicle;
  const t0 = tripEntities[0]?.tripUpdate;
  const a0 = alertEntities[0]?.alert;
  return {
    region: region.id,
    mode: modeLabel,
    name: region.name,
    state: region.state,
    operator: region.operator,
    vehicles: vehicleEntities.length,
    tripUpdates: tripEntities.length,
    alerts: alertEntities.length,
    feedTimestamps: {
      vehicles: longToNumber(vFeed.header?.timestamp),
      tripUpdates: longToNumber(tFeed.header?.timestamp),
      alerts: longToNumber(aFeed.header?.timestamp),
    },
    sample: {
      vehicle: v0
        ? {
            tripId: v0.trip?.tripId || null,
            routeId: v0.trip?.routeId || null,
            lat: v0.position?.latitude ?? null,
            lon: v0.position?.longitude ?? null,
            label: v0.vehicle?.label || v0.vehicle?.id || null,
          }
        : null,
      tripUpdate: t0
        ? {
            tripId: t0.trip?.tripId || null,
            routeId: t0.trip?.routeId || null,
            stops: (t0.stopTimeUpdate || []).length,
          }
        : null,
      alert: a0
        ? {
            header: textFromTranslated(a0.headerText),
            routes: (a0.informedEntity || []).map((i) => i.routeId).filter(Boolean).slice(0, 5),
          }
        : null,
    },
    attribution: region.attribution,
  };
}
