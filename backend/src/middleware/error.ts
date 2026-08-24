import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  const prismaCode = (err as { code?: string }).code;
  if (prismaCode === "P2002") {
    return res.status(409).json({
      error: { code: "CONFLICT", message: "A record with that unique value already exists" },
    });
  }

  logger.error("Unhandled error", {
    path: req.path,
    method: req.method,
    message: err instanceof Error ? err.message : "Unknown error",
  });

  return res.status(500).json({
    error: { code: "INTERNAL", message: "Unexpected server error" },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` },
  });
}
