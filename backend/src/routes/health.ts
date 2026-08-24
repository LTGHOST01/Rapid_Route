import { Router } from "express";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let database: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  res.json({
    ok: database === "up",
    service: "rapidroute-api",
    time: new Date().toISOString(),
    database,
    googleRoutesConfigured: Boolean(env.GOOGLE_MAPS_API_KEY),
    dataSource: env.GOOGLE_MAPS_API_KEY ? "GOOGLE_ROUTES_AVAILABLE" : "DEMO_FALLBACK_ONLY",
  });
});
