import type { Priority, RoadStatus, TrafficLevel, VehicleStatus } from "../types";

export function priorityLabel(priority: Priority) {
  return priority === "STANDARD" ? "NORMAL" : "CRITICAL — TIME FIRST";
}

export function trafficLabel(level: TrafficLevel) {
  if (level === "UNKNOWN") return "Unavailable";
  return level.charAt(0) + level.slice(1).toLowerCase();
}

export function roadLabel(status: RoadStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function vehicleStatusLabel(status: VehicleStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export const DEMO_PRESETS = [
  { id: "CLEAR", label: "Clear" },
  { id: "CONGESTED", label: "Congested" },
  { id: "BLOCKED", label: "Blocked" },
] as const;
