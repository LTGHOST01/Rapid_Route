import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { publicEmergency, publicRouteRequest } from "../lib/dto";
import { toNumber } from "../lib/geo";

export const logsRouter = Router();

logsRouter.use(requireAuth, requireRole("ADMIN", "DISPATCHER"));

logsRouter.get("/route-requests", async (_req, res) => {
  const requests = await prisma.routeRequest.findMany({
    orderBy: { requestedAt: "desc" },
    take: 40,
    include: {
      candidates: { orderBy: { providerRouteIndex: "asc" } },
      selection: { include: { candidate: true } },
      emergency: true,
    },
  });

  res.json({
    routeRequests: requests.map((request) => ({
      ...publicRouteRequest(request),
      emergencyCode: request.emergency.code,
      emergencyPriority: request.emergency.priority,
    })),
  });
});

logsRouter.get("/emergencies", async (_req, res) => {
  const emergencies = await prisma.emergency.findMany({
    include: { vehicle: true, journey: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({
    emergencies: emergencies.map((emergency) => ({
      ...publicEmergency(emergency),
      journeyId: emergency.journey?.id ?? null,
      journeyStatus: emergency.journey?.status ?? null,
    })),
  });
});

logsRouter.get("/journeys", async (_req, res) => {
  const journeys = await prisma.journey.findMany({
    orderBy: { startedAt: "desc" },
    take: 40,
    include: {
      emergency: true,
      vehicle: true,
      selection: { include: { candidate: true } },
      _count: { select: { events: true } },
    },
  });
  res.json({
    journeys: journeys.map((journey) => ({
      id: journey.id,
      status: journey.status,
      startedAt: journey.startedAt,
      estimatedArrivalAt: journey.estimatedArrivalAt,
      progress: toNumber(journey.progress),
      eventCount: journey._count.events,
      emergencyCode: journey.emergency.code,
      priority: journey.emergency.priority,
      vehicleCallSign: journey.vehicle.callSign,
      routeLabel: journey.selection.candidate.label,
    })),
  });
});
