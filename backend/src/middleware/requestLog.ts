import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

export function requestLog(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  res.on("finish", () => {
    logger.info("request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - started,
    });
  });
  next();
}
