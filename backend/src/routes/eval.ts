import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { EVAL_COLUMNS, toCsv } from "../lib/evalSchema";
import {
  evaluateRecords,
  parseEvalPayload,
  scenarioRecords,
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

evalRouter.get("/scenarios", (_req, res) => {
  res.json({
    scenarios: SCENARIOS.map((id) => ({
      id,
      records: scenarioRecords(id),
      result: evaluateRecords(scenarioRecords(id)),
    })),
  });
});

evalRouter.get("/scenarios/:id", (req, res) => {
  const id = paramId(req.params.id) as EvalScenarioId;
  if (!SCENARIOS.includes(id)) throw new BadRequestError("Unknown evaluator scenario");
  const records = scenarioRecords(id);
  res.json({
    id,
    records,
    csv: toCsv(records),
    result: evaluateRecords(records),
  });
});

evalRouter.post("/ingest", requireAuth, (req, res) => {
  const records = parseEvalPayload(req.body);
  res.json(evaluateRecords(records));
});
