import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  assignVehicleSchema,
  calculateRoutesSchema,
  createEmergencySchema,
  dispatchSchema,
  selectCandidateSchema,
} from "../validators";
import {
  assignVehicle,
  calculateRoutes,
  createEmergency,
  dispatchEmergency,
  getEmergency,
  listEmergencies,
  selectCandidate,
} from "../services/dispatchService";
import { publicJourney } from "../lib/dto";
import { paramId } from "../lib/params";

export const emergenciesRouter = Router();

emergenciesRouter.use(requireAuth);

emergenciesRouter.get("/", async (_req, res) => {
  res.json({ emergencies: await listEmergencies() });
});

emergenciesRouter.post("/", async (req, res) => {
  const body = createEmergencySchema.parse(req.body);
  const emergency = await createEmergency(req.user!.id, body);
  res.status(201).json({ emergency });
});

emergenciesRouter.get("/:id", async (req, res) => {
  res.json(await getEmergency(paramId(req.params.id)));
});

emergenciesRouter.post("/:id/assign-vehicle", async (req, res) => {
  const body = assignVehicleSchema.parse(req.body ?? {});
  const emergency = await assignVehicle(paramId(req.params.id), body.vehicleId);
  res.json({ emergency });
});

emergenciesRouter.post("/:id/routes", async (req, res) => {
  const body = calculateRoutesSchema.parse(req.body ?? {});
  const result = await calculateRoutes(paramId(req.params.id), body.forceDemo);
  res.status(201).json(result);
});

emergenciesRouter.post("/:id/select-route", async (req, res) => {
  const body = selectCandidateSchema.parse(req.body);
  const selection = await selectCandidate(paramId(req.params.id), body.candidateId, "DISPATCHER");
  res.json({
    selection: {
      id: selection.id,
      candidateId: selection.candidateId,
      selectedBy: selection.selectedBy,
      version: selection.version,
    },
  });
});

emergenciesRouter.post("/:id/dispatch", async (req, res) => {
  const body = dispatchSchema.parse(req.body ?? {});
  const journey = await dispatchEmergency(paramId(req.params.id), body.candidateId);
  res.status(201).json({ journey: publicJourney(journey) });
});
