import {
  evalRecordSchema,
  normalizePriority,
  normalizeRoad,
  normalizeTraffic,
  parseCsv,
  type EvalRecord,
} from "../lib/evalSchema";
import {
  explainSelection,
  pickWinner,
  scoreCandidates,
  type ScoreInput,
} from "./routeScoringService";
import { BadRequestError } from "../lib/errors";

export const NO_SUITABLE_ROUTE =
  "No suitable route available. The destination cannot currently be reached through the available routes.";

export type EvalScenarioId =
  | "low_traffic"
  | "heavy_traffic"
  | "road_blockage"
  | "destination_unreachable";

export function parseEvalPayload(body: unknown): EvalRecord[] {
  if (typeof body === "string") {
    return parseEvalRecords(parseCsv(body));
  }
  if (body && typeof body === "object") {
    const obj = body as { csv?: string; records?: unknown; data?: unknown };
    if (typeof obj.csv === "string") return parseEvalRecords(parseCsv(obj.csv));
    const rows = obj.records ?? obj.data ?? body;
    if (Array.isArray(rows)) return parseEvalRecords(rows);
  }
  throw new BadRequestError("Provide a JSON array of records or { csv, records }");
}

export function parseEvalRecords(rows: unknown[]): EvalRecord[] {
  if (rows.length === 0) throw new BadRequestError("No evaluator records supplied");
  return rows.map((row, index) => {
    const parsed = evalRecordSchema.safeParse(row);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid record at index ${index}`, parsed.error.issues);
    }
    return parsed.data;
  });
}

export function evaluateRecords(records: EvalRecord[]) {
  const priority = normalizePriority(records[0].emergency_type);
  const candidates: ScoreInput[] = records.map((record, index) => {
    const roadImpact = normalizeRoad(record.road_status);
    return {
      label: `${record.vehicle_id} · corridor ${index + 1}`,
      etaSeconds: toSeconds(record.estimated_travel_time),
      distanceMeters: toMeters(record.road_distance),
      trafficLevel: normalizeTraffic(record.traffic_level),
      roadImpact,
      blocked: roadImpact === "BLOCKED",
      providerRouteIndex: index,
      corridorIds: [`EVAL_${index + 1}`],
    };
  });

  const scored = scoreCandidates(candidates, priority);
  const winner = pickWinner(scored);
  const explanation = explainSelection(scored, winner, priority);

  return {
    inputSchema: [
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
    ],
    recordCount: records.length,
    origin: records[0].current_location,
    destination: records[0].destination,
    vehicleId: records[0].vehicle_id,
    emergencyType: records[0].emergency_type,
    priority,
    noSuitableRoute: winner == null,
    message: winner
      ? explanation.summary
      : NO_SUITABLE_ROUTE,
    recommended: winner
      ? {
          label: winner.label,
          trafficLevel: winner.trafficLevel,
          roadStatus: winner.roadImpact,
          etaSeconds: winner.etaSeconds,
          distanceMeters: winner.distanceMeters,
          score: winner.score,
        }
      : null,
    candidates: scored.map((candidate) => ({
      label: candidate.label,
      trafficLevel: candidate.trafficLevel,
      roadStatus: candidate.roadImpact,
      etaSeconds: candidate.etaSeconds,
      distanceMeters: candidate.distanceMeters,
      blocked: candidate.blocked,
      eligible: candidate.eligible,
      score: candidate.score,
      ineligibilityReason: candidate.ineligibilityReason,
    })),
    explanation: winner
      ? explanation
      : {
          ...explanation,
          summary: NO_SUITABLE_ROUTE,
          reason: NO_SUITABLE_ROUTE,
        },
  };
}

function toSeconds(value: number): number {
  return value <= 180 ? Math.round(value * 60) : Math.round(value);
}

function toMeters(value: number): number {
  return value < 200 ? Math.round(value * 1000) : Math.round(value);
}

export function scenarioRecords(id: EvalScenarioId): EvalRecord[] {
  const stamp = "2026-08-24T10:00:00Z";
  const base = {
    vehicle_id: "AMB-101",
    vehicle_type: "AMBULANCE",
    emergency_type: "CRITICAL",
    current_location: "Dadar",
    destination: "KEM Hospital, Parel",
    latitude: 19.0178,
    longitude: 72.8478,
    timestamp: stamp,
  };

  if (id === "low_traffic") {
    return [
      { ...base, traffic_level: "low", road_status: "clear", road_distance: 9.2, estimated_travel_time: 18 },
      { ...base, traffic_level: "medium", road_status: "clear", road_distance: 10.1, estimated_travel_time: 21 },
      { ...base, traffic_level: "high", road_status: "clear", road_distance: 11.4, estimated_travel_time: 24 },
    ];
  }

  if (id === "heavy_traffic") {
    return [
      { ...base, traffic_level: "high", road_status: "congested", road_distance: 8.4, estimated_travel_time: 32 },
      { ...base, traffic_level: "low", road_status: "clear", road_distance: 10.6, estimated_travel_time: 20 },
      { ...base, traffic_level: "medium", road_status: "clear", road_distance: 11.1, estimated_travel_time: 23 },
    ];
  }

  if (id === "road_blockage") {
    return [
      { ...base, traffic_level: "low", road_status: "blocked", road_distance: 9.2, estimated_travel_time: 18 },
      { ...base, traffic_level: "medium", road_status: "clear", road_distance: 10.8, estimated_travel_time: 22 },
      { ...base, traffic_level: "low", road_status: "clear", road_distance: 12.0, estimated_travel_time: 25 },
    ];
  }

  return [
    { ...base, traffic_level: "high", road_status: "blocked", road_distance: 9.2, estimated_travel_time: 18 },
    { ...base, traffic_level: "high", road_status: "blocked", road_distance: 11.0, estimated_travel_time: 24 },
    { ...base, traffic_level: "medium", road_status: "blocked", road_distance: 13.4, estimated_travel_time: 29 },
  ];
}
