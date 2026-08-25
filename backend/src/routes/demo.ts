import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { demoScenarioSchema } from "../validators";
import { upsertDemoScenario } from "../services/roadConditionService";
import {
  evaluateReroute,
  listActiveJourneys,
  rerouteActiveJourneysAffectedBy,
} from "../services/journeyService";
import { blockedSliceEncodedPolyline, toNumber } from "../lib/geo";
import { invalidateGoogleRoutesCache } from "../services/googleRoutesService";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";

export const demoRouter = Router();

demoRouter.use(requireAuth);

demoRouter.get("/active-journeys", requireRole("ADMIN"), async (_req, res) => {
  res.json({
    label: "DEMO SIMULATION",
    journeys: await listActiveJourneys(),
  });
});

demoRouter.post("/road-scenario", requireRole("ADMIN"), async (req, res) => {
  const body = demoScenarioSchema.parse(req.body);
  let corridorId = body.corridorId ?? "SION_LINK";
  let geometry: { type: string; corridorId: string; label: string; polyline?: string } | undefined;

  if (body.journeyId) {
    const journey = await prisma.journey.findUnique({
      where: { id: body.journeyId },
      include: { selection: { include: { candidate: true } } },
    });
    if (!journey) throw new NotFoundError("Journey not found");
    corridorId = `JOURNEY_${journey.id}`;
    geometry = {
      type: "corridor",
      corridorId,
      label: "Active selected route",
      polyline: blockedSliceEncodedPolyline(
        journey.selection.candidate.polyline,
        toNumber(journey.progress),
      ),
    };
  }

  const condition = await upsertDemoScenario({
    status: body.status,
    corridorId,
    geometry,
    reportedById: req.user!.id,
  });
  invalidateGoogleRoutesCache();

  if (body.journeyId) {
    const reroute = await evaluateReroute(body.journeyId, {
      force: body.status === "BLOCKED",
      reason: `DEMO SIMULATION: admin set active route to ${body.status}`,
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
