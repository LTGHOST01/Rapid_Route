import type { IncidentType, Priority } from "../types";

export function formatDuration(seconds: number): string {
  const mins = Math.max(0, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hours} h` : `${hours} h ${rem} min`;
}

export function displayScore(score: number | null | undefined): number | null {
  if (score == null || Number.isNaN(score)) return null;
  return Math.round(score);
}

export function factorScore(score: number | null | undefined): number {
  return displayScore(score) ?? 0;
}

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function incidentTitle(type?: IncidentType, notes?: string): string {
  if (notes && notes.trim().length > 8 && notes.trim().length < 48) return notes.trim();
  switch (type) {
    case "TRAUMA":
      return "Trauma — crash / injury";
    case "FIRE":
      return "Fire";
    case "POLICE":
      return "Police incident";
    default:
      return "Medical — illness";
  }
}

export function goesToHospital(type?: IncidentType) {
  return type !== "FIRE" && type !== "POLICE";
}

export function sameCoords(
  a?: { lat: number; lng: number } | null,
  b?: { lat: number; lng: number } | null,
) {
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) < 0.0008 && Math.abs(a.lng - b.lng) < 0.0008;
}

export function pathEnds(
  emergency: {
    incidentType?: IncidentType;
    originLabel: string;
    destinationLabel: string;
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
    vehicle?: { locationLabel?: string | null; callSign?: string } | null;
  },
) {
  const sceneToScene =
    !goesToHospital(emergency.incidentType) &&
    sameCoords(
      { lat: emergency.originLat, lng: emergency.originLng },
      { lat: emergency.destinationLat, lng: emergency.destinationLng },
    );
  if (sceneToScene) {
    const from =
      emergency.vehicle?.locationLabel ||
      emergency.vehicle?.callSign ||
      "Assigned unit";
    return { from, to: emergency.originLabel };
  }
  return { from: emergency.originLabel, to: emergency.destinationLabel };
}

export function priorityShort(priority: Priority): string {
  return priority === "STANDARD" ? "NORMAL" : "CRITICAL";
}

export function isTimeFirst(priority?: Priority) {
  return priority !== "STANDARD";
}
