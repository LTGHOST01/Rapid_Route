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

const SCENARIOS: EvalScenarioId[] = [
  "low_traffic",
  "heavy_traffic",
  "road_blockage",
  "destination_unreachable",
];

export const evalRouter = Router();

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

evalRouter.get("/run-all", (_req, res) => {
  res.json({
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
  });
});

evalRouter.get("/scenarios/:id", (req, res) => {
  const id = paramId(req.params.id) as EvalScenarioId;
  if (!SCENARIOS.includes(id)) throw new BadRequestError("Unknown evaluator scenario");
  const records = scenarioRecords(id);
  const result = evaluateRecords(records);
  res.json({
    id,
    records,
    csv: toCsv(records),
    passed: scenarioPassed(id, result),
    expectation: SCENARIO_EXPECTATIONS[id],
    result,
  });
});

evalRouter.post("/ingest", requireAuth, (req, res) => {
  const records = parseEvalPayload(req.body);
  res.json(evaluateRecords(records));
});
