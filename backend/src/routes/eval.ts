import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { EVAL_COLUMNS, toCsv } from "../lib/evalSchema";
import {
  evaluateRecords,
  parseEvalPayload,
  scenarioPassed,
  scenarioRecords,
  SCENARIO_EXPECTATIONS,
  type EvalScenarioId,
} from "../services/evalService";
import { BadRequestError } from "../lib/errors";
import { paramId } from "../lib/params";
import { encodePolyline, type LatLng } from "../lib/geo";
import { MUMBAI_HOSPITALS } from "../lib/locations";

const SCENARIOS: EvalScenarioId[] = [
  "low_traffic",
  "heavy_traffic",
  "road_blockage",
  "destination_unreachable",
];

export const evalRouter = Router();

evalRouter.use(requireAuth);

evalRouter.get("/schema", (_req, res) => {
  res.json({
    columns: EVAL_COLUMNS,
    contentTypes: ["application/json", "text/csv"],
    example: scenarioRecords("low_traffic")[0],
  });
});

const SCENARIO_META: Record<EvalScenarioId, { title: string; description: string }> = {
  low_traffic: {
    title: "Low traffic",
    description: "Multiple clear corridors with different traffic. Expect the fastest suitable route.",
  },
  heavy_traffic: {
    title: "Heavy traffic",
    description: "Primary corridor is congested. Expect a clearer alternative.",
  },
  road_blockage: {
    title: "Road blockage",
    description: "Primary corridor is blocked. Expect that candidate to be ineligible.",
  },
  destination_unreachable: {
    title: "Destination unreachable",
    description: "Every corridor is blocked. Expect no suitable route.",
  },
};

evalRouter.get("/scenarios", (_req, res) => {
  res.json({
    label: "EVALUATION",
    scenarios: SCENARIOS.map((id) => ({
      id,
      title: SCENARIO_META[id].title,
      description: SCENARIO_META[id].description,
      expectation: SCENARIO_EXPECTATIONS[id],
    })),
  });
});

function runAllScenarios() {
  return {
    label: "EVALUATION",
    results: SCENARIOS.map((id) => {
      const records = scenarioRecords(id);
      const result = evaluateRecords(records);
      return {
        id,
        title: SCENARIO_META[id].title,
        description: SCENARIO_META[id].description,
        expectation: SCENARIO_EXPECTATIONS[id],
        passed: scenarioPassed(id, result),
        result,
      };
    }),
  };
}

evalRouter.get("/run-all", (_req, res) => {
  res.json(runAllScenarios());
});

evalRouter.post("/run-all", (_req, res) => {
  res.json(runAllScenarios());
});

evalRouter.get("/scenarios/:id", (req, res) => {
  const id = paramId(req.params.id) as EvalScenarioId;
  if (!SCENARIOS.includes(id)) throw new BadRequestError("Unknown evaluator scenario");
  const records = scenarioRecords(id);
  const result = evaluateRecords(records);
  res.json({
    id,
    title: SCENARIO_META[id].title,
    description: SCENARIO_META[id].description,
    records,
    csv: toCsv(records),
    passed: scenarioPassed(id, result),
    expectation: SCENARIO_EXPECTATIONS[id],
    result,
    mapDemo: buildEvalMapDemo(id, records, result),
  });
});

function buildEvalMapDemo(
  id: EvalScenarioId,
  records: ReturnType<typeof scenarioRecords>,
  result: ReturnType<typeof evaluateRecords>,
) {
  const hospital = MUMBAI_HOSPITALS.find((place) => place.id === "kem")!;
  const origin = {
    lat: records[0].latitude,
    lng: records[0].longitude,
    label: records[0].current_location,
  };
  const destination = {
    lat: hospital.lat,
    lng: hospital.lng,
    label: records[0].destination,
  };
  const paths = evalCorridors(origin, destination);
  const candidates = result.candidates.map((candidate, index) => {
    const path = paths[index] ?? paths[0];
    return {
      id: `eval-${id}-${index}`,
      label: candidate.label,
      polyline: encodePolyline(path),
      etaSeconds: candidate.etaSeconds,
      etaLabel: `${Math.round(candidate.etaSeconds / 60)} min`,
      distanceMeters: candidate.distanceMeters,
      distanceLabel: `${(candidate.distanceMeters / 1000).toFixed(1)} km`,
      trafficLevel: candidate.trafficLevel,
      roadImpact: candidate.roadStatus,
      blocked: candidate.blocked,
      score: candidate.score,
      corridorIds: [`EVAL_${index + 1}`],
    };
  });
  return {
    label: "EVALUATION SIMULATION",
    origin,
    destination,
    vehicle: {
      callSign: records[0].vehicle_id,
      type: records[0].vehicle_type,
      lat: origin.lat + 0.0042,
      lng: origin.lng - 0.0075,
    },
    candidates,
    selectedId: result.recommended
      ? candidates.find((c) => c.label === result.recommended?.label)?.id ?? null
      : null,
  };
}

function evalCorridors(origin: LatLng, destination: LatLng): LatLng[][] {
  const lerp = (t: number, latOff = 0, lngOff = 0): LatLng => ({
    lat: origin.lat + (destination.lat - origin.lat) * t + latOff,
    lng: origin.lng + (destination.lng - origin.lng) * t + lngOff,
  });
  return [
    [origin, lerp(0.35, 0.001, -0.004), lerp(0.7, 0.0005, -0.0025), destination],
    [origin, lerp(0.3, -0.0005, 0.0015), lerp(0.65, -0.0008, 0.002), destination],
    [origin, lerp(0.28, 0.004, 0.006), lerp(0.58, 0.003, 0.007), destination],
  ];
}

evalRouter.post("/ingest", requireAuth, (req, res) => {
  const records = parseEvalPayload(req.body);
  res.json(evaluateRecords(records));
});
