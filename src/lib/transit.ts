/**
 * Australian public transport — GTFS-Realtime (Phase 1: open feeds, no keys).
 *
 * Regions:
 *   seq — Translink SEQ (QLD)  https://gtfsrt.api.translink.com.au
 *   sa  — Adelaide Metro       https://gtfs.adelaidemetro.com.au
 *
 * Phase 2 (needs free developer keys — not wired yet):
 *   nsw — Transport for NSW Open Data
 *   vic — PTV / Transport Victoria
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

export type TransitRegionId = "seq" | "sa";

export type TransitRegion = {
  id: TransitRegionId;
  name: string;
  state: string;
  operator: string;
  feeds: { vehicles: string; tripUpdates: string; alerts: string };
  attribution: string;
  status: "live" | "key_required";
  keySignup?: string;
};

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
];

/** Planned regions — documented for agents; not live until keys configured. */
export const PLANNED_REGIONS = [
  {
    id: "nsw",
    name: "New South Wales",
    state: "NSW",
    operator: "Transport for NSW",
    status: "key_required" as const,
    keySignup: "https://opendata.transport.nsw.gov.au/data/user/register",
    portal: "https://opendata.transport.nsw.gov.au/",
  },
  {
    id: "vic",
    name: "Victoria",
    state: "VIC",
    operator: "PTV / Transport Victoria",
    status: "key_required" as const,
    keySignup: "https://opendata.transport.vic.gov.au/",
    portal: "https://opendata.transport.vic.gov.au/dataset/gtfs-realtime",
    notes: "Also legacy PTV Timetable API (dev id + key).",
  },
];

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
  return {
    live: REGIONS.map(({ feeds: _f, ...r }) => r),
    planned: PLANNED_REGIONS,
    attribution: "GTFS-Realtime feeds from Australian open data portals. Phase 1: QLD SEQ + SA Adelaide (no API key).",
  };
}

async function fetchFeed(url: string): Promise<GtfsFeed> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/x-protobuf, application/octet-stream, */*" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upstream GTFS-RT failed (${res.status}) ${url}: ${t.slice(0, 160)}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buf);
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
  opts?: { limit?: number; routeId?: string },
) {
  const region = getRegion(regionId);
  if (!region) throw new Error(`Unknown region '${regionId}'. Use seq or sa.`);
  const feed = await fetchFeed(region.feeds.vehicles);
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
    });
    if (vehicles.length >= limit) break;
  }
  return {
    region: region.id,
    type: "vehicles" as const,
    count: vehicles.length,
    feedTimestamp: longToNumber(feed.header?.timestamp),
    vehicles,
    attribution: region.attribution,
  };
}

export async function getTripUpdates(
  regionId: string,
  opts?: { limit?: number; routeId?: string; stopId?: string },
) {
  const region = getRegion(regionId);
  if (!region) throw new Error(`Unknown region '${regionId}'. Use seq or sa.`);
  const feed = await fetchFeed(region.feeds.tripUpdates);
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
    });
    if (updates.length >= limit) break;
  }
  return {
    region: region.id,
    type: "trip_updates" as const,
    count: updates.length,
    feedTimestamp: longToNumber(feed.header?.timestamp),
    tripUpdates: updates,
    attribution: region.attribution,
  };
}

export async function getAlerts(regionId: string, opts?: { limit?: number; routeId?: string }) {
  const region = getRegion(regionId);
  if (!region) throw new Error(`Unknown region '${regionId}'. Use seq or sa.`);
  const feed = await fetchFeed(region.feeds.alerts);
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
    });
    if (alerts.length >= limit) break;
  }
  return {
    region: region.id,
    type: "alerts" as const,
    count: alerts.length,
    feedTimestamp: longToNumber(feed.header?.timestamp),
    alerts,
    attribution: region.attribution,
  };
}

export async function getSummary(regionId: string) {
  const region = getRegion(regionId);
  if (!region) throw new Error(`Unknown region '${regionId}'. Use seq or sa.`);
  const [vFeed, tFeed, aFeed] = await Promise.all([
    fetchFeed(region.feeds.vehicles),
    fetchFeed(region.feeds.tripUpdates),
    fetchFeed(region.feeds.alerts),
  ]);
  const vehicleEntities = (vFeed.entity || []).filter((e) => e.vehicle);
  const tripEntities = (tFeed.entity || []).filter((e) => e.tripUpdate);
  const alertEntities = (aFeed.entity || []).filter((e) => e.alert);
  const v0 = vehicleEntities[0]?.vehicle;
  const t0 = tripEntities[0]?.tripUpdate;
  const a0 = alertEntities[0]?.alert;
  return {
    region: region.id,
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
