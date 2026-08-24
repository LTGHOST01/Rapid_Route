import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { demoScenarioSchema } from "../validators";
import { upsertDemoScenario } from "../services/roadConditionService";
import { evaluateReroute, rerouteActiveJourneysAffectedBy } from "../services/journeyService";

export const demoRouter = Router();

demoRouter.use(requireAuth);

demoRouter.post("/road-scenario", async (req, res) => {
  const body = demoScenarioSchema.parse(req.body);
  const corridorId = body.corridorId ?? "SION_LINK";
  const condition = await upsertDemoScenario({
    status: body.status,
    corridorId,
    reportedById: req.user!.id,
  });

  if (body.journeyId) {
    const reroute = await evaluateReroute(body.journeyId, {
      reason: `DEMO SIMULATION: ${corridorId} set to ${body.status}`,
    });
    return res.json({
      label: "DEMO SIMULATION",
      roadCondition: condition,
      reroute,
    });
  }

  const reroutes = await rerouteActiveJourneysAffectedBy(corridorId, body.status);
  res.json({
    label: "DEMO SIMULATION",
    roadCondition: condition,
    reroutes,
  });
});
