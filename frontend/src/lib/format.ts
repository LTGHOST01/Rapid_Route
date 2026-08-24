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
  if (notes && notes.trim().length > 8 && notes.trim().length < 40) return notes.trim();
  switch (type) {
    case "TRAUMA":
      return "Trauma";
    case "FIRE":
      return "Fire incident";
    case "POLICE":
      return "Police incident";
    default:
      return "Medical emergency";
  }
}

export function priorityShort(priority: Priority): string {
  if (priority === "STANDARD") return "Medium";
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}
