import type { TrafficLevel } from "@prisma/client";
import { encodePolyline, type LatLng } from "../lib/geo";

export type NormalizedRoute = {
  providerRouteIndex: number;
  label: string;
  polyline: string;
  etaSeconds: number;
  distanceMeters: number;
  trafficLevel: TrafficLevel;
  corridorIds: string[];
};

const ROUTE_A: LatLng[] = [
  { lat: 18.9256, lng: 72.8242 },
  { lat: 18.9432, lng: 72.8232 },
  { lat: 18.956, lng: 72.821 },
  { lat: 18.969, lng: 72.814 },
  { lat: 18.982, lng: 72.811 },
  { lat: 18.994, lng: 72.813 },
  { lat: 19.008, lng: 72.8155 },
  { lat: 19.02, lng: 72.818 },
  { lat: 19.032, lng: 72.822 },
  { lat: 19.042, lng: 72.826 },
  { lat: 19.051, lng: 72.8295 },
];

const ROUTE_B: LatLng[] = [
  { lat: 18.9256, lng: 72.8242 },
  { lat: 18.935, lng: 72.828 },
  { lat: 18.95, lng: 72.831 },
  { lat: 18.965, lng: 72.834 },
  { lat: 18.98, lng: 72.836 },
  { lat: 18.995, lng: 72.838 },
  { lat: 19.01, lng: 72.836 },
  { lat: 19.025, lng: 72.833 },
  { lat: 19.04, lng: 72.83 },
  { lat: 19.051, lng: 72.8295 },
];

const ROUTE_C: LatLng[] = [
  { lat: 18.9256, lng: 72.8242 },
  { lat: 18.938, lng: 72.835 },
  { lat: 18.95, lng: 72.842 },
  { lat: 18.97, lng: 72.845 },
  { lat: 18.99, lng: 72.848 },
  { lat: 19.01, lng: 72.85 },
  { lat: 19.03, lng: 72.845 },
  { lat: 19.042, lng: 72.836 },
  { lat: 19.051, lng: 72.8295 },
];

function shiftPath(points: LatLng[], origin: LatLng, destination: LatLng): LatLng[] {
  const from = points[0];
  const to = points[points.length - 1];
  return points.map((point, index) => {
    const t = index / (points.length - 1);
    const baseShiftLat = origin.lat - from.lat + (destination.lat - to.lat) * t;
    const baseShiftLng = origin.lng - from.lng + (destination.lng - to.lng) * t;
    return {
      lat: Number((point.lat + baseShiftLat).toFixed(6)),
      lng: Number((point.lng + baseShiftLng).toFixed(6)),
    };
  });
}

function pathDistance(points: LatLng[]): number {
  let meters = 0;
  for (let i = 1; i < points.length; i++) {
    const dLat = points[i].lat - points[i - 1].lat;
    const dLng = points[i].lng - points[i - 1].lng;
    meters += Math.sqrt(dLat * dLat + dLng * dLng) * 111_320;
  }
  return Math.round(meters);
}

export function buildDemoCandidates(origin: LatLng, destination: LatLng): NormalizedRoute[] {
  const coastal = shiftPath(ROUTE_A, origin, destination);
  const inland = shiftPath(ROUTE_B, origin, destination);
  const eastern = shiftPath(ROUTE_C, origin, destination);

  const coastalMeters = pathDistance(coastal);
  const inlandMeters = pathDistance(inland);
  const easternMeters = pathDistance(eastern);

  return [
    {
      providerRouteIndex: 0,
      label: "Route A — coastal",
      polyline: encodePolyline(coastal),
      etaSeconds: 600,
      distanceMeters: coastalMeters,
      trafficLevel: "HIGH",
      corridorIds: ["SION_LINK"],
    },
    {
      providerRouteIndex: 1,
      label: "Route B — inland",
      polyline: encodePolyline(inland),
      etaSeconds: 720,
      distanceMeters: inlandMeters,
      trafficLevel: "MEDIUM",
      corridorIds: ["PAREL_INLAND"],
    },
    {
      providerRouteIndex: 2,
      label: "Route C — eastern",
      polyline: encodePolyline(eastern),
      etaSeconds: 780,
      distanceMeters: easternMeters,
      trafficLevel: "LOW",
      corridorIds: ["EASTERN_CONNECTOR"],
    },
  ];
}

export const DEMO_FALLBACK_MESSAGE =
  "Google Routes API was unavailable. Candidate geometry, ETA, and traffic shown here are DEMO SIMULATION fixtures — not live Google traffic.";
