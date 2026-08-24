import { z } from "zod";
import type { EmergencyPriority, RoadStatus, TrafficLevel, VehicleType } from "@prisma/client";

export const EVAL_COLUMNS = [
  "vehicle_id",
  "vehicle_type",
  "emergency_type",
  "current_location",
  "destination",
  "latitude",
  "longitude",
  "traffic_level",
  "road_status",
  "road_distance",
  "estimated_travel_time",
  "timestamp",
] as const;

export type EvalRecord = {
  vehicle_id: string;
  vehicle_type: string;
  emergency_type: string;
  current_location: string;
  destination: string;
  latitude: number;
  longitude: number;
  traffic_level: string;
  road_status: string;
  road_distance: number;
  estimated_travel_time: number;
  timestamp: string;
};

const looseString = z.coerce.string().trim().min(1);

export const evalRecordSchema = z.object({
  vehicle_id: looseString,
  vehicle_type: looseString,
  emergency_type: looseString,
  current_location: looseString,
  destination: looseString,
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  traffic_level: looseString,
  road_status: looseString,
  road_distance: z.coerce.number().nonnegative(),
  estimated_travel_time: z.coerce.number().nonnegative(),
  timestamp: looseString,
});

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

export function normalizeTraffic(value: string): TrafficLevel {
  const v = value.trim().toLowerCase();
  if (v === "low" || v === "light" || v === "clear") return "LOW";
  if (v === "medium" || v === "moderate") return "MEDIUM";
  if (v === "high" || v === "heavy" || v === "severe") return "HIGH";
  return "UNKNOWN";
}

export function normalizeRoad(value: string): RoadStatus {
  const v = value.trim().toLowerCase();
  if (v === "blocked" || v === "closed" || v === "unreachable") return "BLOCKED";
  if (v === "congested" || v === "heavy") return "CONGESTED";
  if (v === "advisory" || v === "caution") return "ADVISORY";
  return "CLEAR";
}

export function normalizePriority(value: string): EmergencyPriority {
  const v = value.trim().toUpperCase();
  if (v === "CRITICAL" || v === "TRAUMA") return "CRITICAL";
  if (v === "HIGH" || v === "FIRE") return "HIGH";
  return "STANDARD";
}

export function normalizeVehicleType(value: string): VehicleType {
  const v = value.trim().toUpperCase();
  if (v.includes("FIRE")) return "FIRE";
  if (v.includes("POLICE")) return "POLICE";
  return "AMBULANCE";
}

export function toCsv(records: EvalRecord[]): string {
  const header = EVAL_COLUMNS.join(",");
  const rows = records.map((record) =>
    EVAL_COLUMNS.map((column) => csvEscape(String(record[column]))).join(","),
  );
  return [header, ...rows].join("\n") + "\n";
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
