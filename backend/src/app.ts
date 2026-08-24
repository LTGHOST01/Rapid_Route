import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigins } from "./config/env";
import { requestLog } from "./middleware/requestLog";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { emergenciesRouter } from "./routes/emergencies";
import { vehiclesRouter } from "./routes/vehicles";
import { roadConditionsRouter } from "./routes/roadConditions";
import { journeysRouter } from "./routes/journeys";
import { logsRouter } from "./routes/logs";
import { healthRouter } from "./routes/health";
import { adminRouter } from "./routes/admin";
import { demoRouter } from "./routes/demo";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLog);

  app.use("/health", healthRouter);
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/emergencies", emergenciesRouter);
  app.use("/api/vehicles", vehiclesRouter);
  app.use("/api/road-conditions", roadConditionsRouter);
  app.use("/api/journeys", journeysRouter);
  app.use("/api/logs", logsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/demo", demoRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
