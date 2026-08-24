import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { createRoadConditionSchema, patchRoadConditionSchema } from "../validators";
import {
  createRoadCondition,
  listRoadConditions,
  updateRoadCondition,
} from "../services/roadConditionService";
import { rerouteActiveJourneysAffectedBy } from "../services/journeyService";
import { paramId } from "../lib/params";

export const roadConditionsRouter = Router();

roadConditionsRouter.use(requireAuth);

roadConditionsRouter.get("/", async (req, res) => {
  const activeOnly = req.query.active === "true";
  res.json({ roadConditions: await listRoadConditions(activeOnly) });
});

roadConditionsRouter.post("/", requireRole("ADMIN"), async (req, res) => {
  const body = createRoadConditionSchema.parse(req.body);
  const condition = await createRoadCondition({
    ...body,
    reportedById: req.user!.id,
  });
  const reroutes = await rerouteActiveJourneysAffectedBy(condition.corridorId, condition.status);
  res.status(201).json({ roadCondition: condition, reroutes });
});

roadConditionsRouter.patch("/:id", requireRole("ADMIN"), async (req, res) => {
  const body = patchRoadConditionSchema.parse(req.body);
  const condition = await updateRoadCondition(paramId(req.params.id), body);
  const reroutes = await rerouteActiveJourneysAffectedBy(condition.corridorId, condition.status);
  res.json({ roadCondition: condition, reroutes });
});
