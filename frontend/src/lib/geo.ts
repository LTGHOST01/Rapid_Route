export type LatLng = { lat: number; lng: number };

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export function boundsOf(points: LatLng[]) {
  if (points.length === 0) {
    return { minLat: 18.9, maxLat: 19.1, minLng: 72.8, maxLng: 72.88 };
  }
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return { minLat, maxLat, minLng, maxLng };
}

export function formatEtaClock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export const MUMBAI_ORIGINS = [
  { id: "dadar", label: "Dadar", lat: 19.0178, lng: 72.8478 },
  { id: "sion", label: "Sion", lat: 19.043, lng: 72.863 },
  { id: "kurla", label: "Kurla", lat: 19.0726, lng: 72.8845 },
  { id: "mumbai_central", label: "Mumbai Central", lat: 18.9696, lng: 72.8193 },
];

export const MUMBAI_HOSPITALS = [
  { id: "kem", label: "KEM Hospital, Parel", lat: 19.0022, lng: 72.8416 },
  { id: "sion_hospital", label: "Sion Hospital (LTMMC)", lat: 19.0368, lng: 72.86 },
  { id: "jj", label: "JJ Hospital, Byculla", lat: 18.9633, lng: 72.8331 },
];

export const DEMO_CORRIDORS = [
  { id: "SION_LINK", label: "Sion–Parel link" },
  { id: "PAREL_INLAND", label: "Parel inland" },
  { id: "EASTERN_CONNECTOR", label: "Eastern connector" },
];

export const MUMBAI_DEMO = {
  incidentType: "TRAUMA" as const,
  priority: "CRITICAL" as const,
  originLabel: "Dadar",
  originLat: 19.0178,
  originLng: 72.8478,
  destinationLabel: "KEM Hospital, Parel",
  destinationLat: 19.0022,
  destinationLng: 72.8416,
  notes: "Multi-vehicle collision at Dadar. Two critical patients for KEM.",
  blockCorridorId: "SION_LINK",
};
