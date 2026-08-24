import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN", "DISPATCHER"));

adminRouter.get("/stats", async (_req, res) => {
  const [
    emergencies,
    activeJourneys,
    vehicles,
    routeRequests,
    rerouteEvents,
    demoRequests,
    googleRequests,
  ] = await Promise.all([
    prisma.emergency.groupBy({ by: ["status"], _count: true }),
    prisma.journey.count({ where: { status: "ACTIVE" } }),
    prisma.emergencyVehicle.groupBy({ by: ["status"], _count: true }),
    prisma.routeRequest.count(),
    prisma.routeEvent.count({ where: { type: "REROUTED" } }),
    prisma.routeRequest.count({ where: { provider: "DEMO" } }),
    prisma.routeRequest.count({ where: { provider: "GOOGLE" } }),
  ]);

  res.json({
    stats: {
      emergencies: Object.fromEntries(emergencies.map((row) => [row.status, row._count])),
      activeJourneys,
      vehicles: Object.fromEntries(vehicles.map((row) => [row.status, row._count])),
      routeRequests,
      googleRequests,
      demoRequests,
      reroutes: rerouteEvents,
    },
  });
});
