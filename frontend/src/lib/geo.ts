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
  { id: "bandra_west", label: "Bandra West", lat: 19.0596, lng: 72.8295 },
  { id: "bandra_east", label: "Bandra East", lat: 19.0607, lng: 72.8489 },
  { id: "sion", label: "Sion", lat: 19.043, lng: 72.863 },
  { id: "kurla", label: "Kurla", lat: 19.0726, lng: 72.8845 },
  { id: "mumbai_central", label: "Mumbai Central", lat: 18.9696, lng: 72.8193 },
  { id: "worli", label: "Worli", lat: 19.0176, lng: 72.8172 },
  { id: "lower_parel", label: "Lower Parel", lat: 18.9935, lng: 72.8305 },
  { id: "parel", label: "Parel", lat: 19.003, lng: 72.842 },
  { id: "prabhadevi", label: "Prabhadevi", lat: 19.0166, lng: 72.8289 },
  { id: "mahim", label: "Mahim", lat: 19.041, lng: 72.84 },
  { id: "wadala", label: "Wadala", lat: 19.0144, lng: 72.8631 },
  { id: "chembur", label: "Chembur", lat: 19.0522, lng: 72.8994 },
  { id: "powai", label: "Powai", lat: 19.1197, lng: 72.905 },
  { id: "andheri", label: "Andheri", lat: 19.1197, lng: 72.8468 },
  { id: "juhu", label: "Juhu", lat: 19.1075, lng: 72.8263 },
  { id: "santacruz", label: "Santacruz", lat: 19.081, lng: 72.841 },
  { id: "vile_parle", label: "Vile Parle", lat: 19.099, lng: 72.844 },
  { id: "goregaon", label: "Goregaon", lat: 19.1663, lng: 72.8526 },
  { id: "byculla", label: "Byculla", lat: 18.9766, lng: 72.8328 },
  { id: "colaba", label: "Colaba", lat: 18.9067, lng: 72.8147 },
  { id: "nariman_point", label: "Nariman Point", lat: 18.9256, lng: 72.8242 },
  { id: "csmt", label: "CSMT", lat: 18.9402, lng: 72.8353 },
];

export type HospitalPlace = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  area: string;
  facilityType: string;
};

export const MUMBAI_HOSPITALS: HospitalPlace[] = [
  { id: "holy_family", label: "Holy Family Hospital", lat: 19.0548, lng: 72.8278, area: "Bandra West", facilityType: "Multispecialty hospital" },
  { id: "lilavati", label: "Lilavati Hospital", lat: 19.0514, lng: 72.8292, area: "Bandra West", facilityType: "Multispecialty hospital" },
  { id: "asian_heart", label: "Asian Heart Institute", lat: 19.0655, lng: 72.8694, area: "Bandra East", facilityType: "Cardiac hospital" },
  { id: "bhabha", label: "Bhabha Hospital", lat: 19.0602, lng: 72.832, area: "Bandra West", facilityType: "Municipal general hospital" },
  { id: "kem", label: "KEM Hospital", lat: 19.0022, lng: 72.8416, area: "Parel", facilityType: "Tertiary public hospital" },
  { id: "sion_hospital", label: "Sion Hospital (LTMMC)", lat: 19.0368, lng: 72.86, area: "Sion", facilityType: "Tertiary public hospital" },
  { id: "jj", label: "JJ Hospital", lat: 18.9633, lng: 72.8331, area: "Byculla", facilityType: "Tertiary public hospital" },
  { id: "tata_memorial", label: "Tata Memorial Hospital", lat: 19.0048, lng: 72.8431, area: "Parel", facilityType: "Cancer hospital" },
  { id: "hinduja", label: "P.D. Hinduja Hospital", lat: 19.033, lng: 72.8385, area: "Mahim", facilityType: "Multispecialty hospital" },
  { id: "nanavati", label: "Nanavati Max Hospital", lat: 19.096, lng: 72.84, area: "Vile Parle", facilityType: "Multispecialty hospital" },
  { id: "cooper", label: "Cooper Hospital", lat: 19.1076, lng: 72.836, area: "Juhu", facilityType: "Municipal general hospital" },
  { id: "breach_candy", label: "Breach Candy Hospital", lat: 18.9726, lng: 72.8045, area: "Breach Candy", facilityType: "Multispecialty hospital" },
  { id: "bombay_hospital", label: "Bombay Hospital", lat: 18.941, lng: 72.828, area: "Marine Lines", facilityType: "Multispecialty hospital" },
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
  destinationLabel: "KEM Hospital",
  destinationLat: 19.0022,
  destinationLng: 72.8416,
  notes: "Multi-vehicle collision at Dadar. Two critical patients for KEM.",
  blockCorridorId: "SION_LINK",
};
