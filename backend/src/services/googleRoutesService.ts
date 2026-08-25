import { env } from "../config/env";
import { logger } from "../lib/logger";
import type { LatLng } from "../lib/geo";
import type { TrafficLevel } from "@prisma/client";
import type { NormalizedRoute } from "./demoFallbackService";

const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELD_MASK = [
  "routes.duration",
  "routes.staticDuration",
  "routes.distanceMeters",
  "routes.polyline.encodedPolyline",
  "routes.travelAdvisory.speedReadingIntervals",
].join(",");

type GoogleSpeed = "SPEED_UNSPECIFIED" | "NORMAL" | "SLOW" | "TRAFFIC_JAM";

type GoogleRoute = {
  duration?: string;
  staticDuration?: string;
  distanceMeters?: number;
  polyline?: { encodedPolyline?: string };
  travelAdvisory?: {
    speedReadingIntervals?: Array<{ speed?: GoogleSpeed }>;
  };
};

export type GoogleRoutesResult =
  | { ok: true; routes: NormalizedRoute[] }
  | { ok: false; reason: string; status?: number };

function parseDurationSeconds(value?: string): number {
  if (!value) return 0;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(value);
  return match ? Math.round(Number(match[1])) : 0;
}

function deriveTraffic(route: GoogleRoute): TrafficLevel {
  const intervals = route.travelAdvisory?.speedReadingIntervals ?? [];
  if (intervals.length > 0) {
    const jam = intervals.filter((i) => i.speed === "TRAFFIC_JAM").length;
    const slow = intervals.filter((i) => i.speed === "SLOW").length;
    const ratio = (jam * 2 + slow) / intervals.length;
    if (ratio >= 0.45) return "HIGH";
    if (ratio >= 0.18) return "MEDIUM";
    return "LOW";
  }

  const live = parseDurationSeconds(route.duration);
  const baseline = parseDurationSeconds(route.staticDuration);
  if (!live || !baseline) return "UNKNOWN";
  const ratio = live / baseline;
  if (ratio >= 1.45) return "HIGH";
  if (ratio >= 1.18) return "MEDIUM";
  return "LOW";
}

const cache = new Map<string, { expires: number; routes: NormalizedRoute[] }>();

const DEMO_VIA_POINTS: Array<LatLng & { label: string }> = [
  { lat: 19.043, lng: 72.863, label: "Sion" },
  { lat: 18.9947, lng: 72.8365, label: "Lalbaug" },
];

export function invalidateGoogleRoutesCache() {
  cache.clear();
}

export async function computeGoogleRoutes(
  origin: LatLng,
  destination: LatLng,
  options: { bypassCache?: boolean; ensureAlternate?: boolean } = {},
): Promise<GoogleRoutesResult> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    return { ok: false, reason: "GOOGLE_MAPS_API_KEY is not configured" };
  }

  const cacheKey = cacheKeyFor(origin, destination);
  if (!options.bypassCache) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return { ok: true, routes: cached.routes };
    }
  }

  const primary = await requestGoogleRoutes(origin, destination);
  if (!primary.ok) return primary;

  let routes = primary.routes;
  const tripKm = haversineKm(origin, destination);
  if ((options.ensureAlternate ?? true) && routes.length < 2 && tripKm >= 5) {
    for (const via of DEMO_VIA_POINTS) {
      const extra = await requestGoogleRoutes(origin, destination, via);
      if (!extra.ok || extra.routes.length === 0) continue;
      const candidate = extra.routes[0];
      if (isDistinctFrom(candidate.polyline, routes[0].polyline)) {
        routes = [
          ...routes,
          {
            ...candidate,
            providerRouteIndex: routes.length,
            label: `Route ${String.fromCharCode(65 + routes.length)} — via ${via.label}`,
            corridorIds: [`VIA_${via.label.toUpperCase()}`],
          },
        ];
        logger.info("Injected waypoint alternate for demo resilience", { via: via.label });
        break;
      }
    }
  }

  cache.set(cacheKey, { expires: Date.now() + 45_000, routes });
  return { ok: true, routes };
}

function haversineKm(a: LatLng, b: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function cacheKeyFor(origin: LatLng, destination: LatLng) {
  return `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
}

function isDistinctFrom(a: string, b: string) {
  if (a === b) return false;
  const head = Math.min(48, a.length, b.length);
  return a.slice(0, head) !== b.slice(0, head);
}

async function requestGoogleRoutes(
  origin: LatLng,
  destination: LatLng,
  via?: LatLng,
): Promise<GoogleRoutesResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.GOOGLE_ROUTES_TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: !via,
      languageCode: "en-US",
      units: "METRIC",
    };
    if (via) {
      body.intermediates = [
        { location: { latLng: { latitude: via.lat, longitude: via.lng } } },
      ];
    }

    const response = await fetch(ROUTES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.warn("Google Routes API error", { status: response.status, body: text.slice(0, 300) });
      return {
        ok: false,
        status: response.status,
        reason: `Google Routes API returned ${response.status}`,
      };
    }

    const data = (await response.json()) as { routes?: GoogleRoute[] };
    const routes = (data.routes ?? [])
      .map((route, index): NormalizedRoute | null => {
        const polyline = route.polyline?.encodedPolyline;
        const etaSeconds = parseDurationSeconds(route.duration);
        const distanceMeters = route.distanceMeters ?? 0;
        if (!polyline || !etaSeconds || !distanceMeters) return null;
        return {
          providerRouteIndex: index,
          label: `Route ${String.fromCharCode(65 + index)}`,
          polyline,
          etaSeconds,
          distanceMeters,
          trafficLevel: deriveTraffic(route),
          corridorIds: [],
        };
      })
      .filter((route): route is NormalizedRoute => route !== null);

    if (routes.length === 0) {
      return { ok: false, reason: "Google Routes API returned no usable candidates" };
    }
    return { ok: true, routes };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "Google Routes API timed out"
        : error instanceof Error
          ? error.message
          : "Google Routes API request failed";
    logger.warn("Google Routes API failure", { reason });
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}
