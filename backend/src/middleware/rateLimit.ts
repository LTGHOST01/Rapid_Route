import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(options: {
  windowMs: number;
  max: number;
  prefix: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${options.prefix}:${req.ip ?? "unknown"}:${req.path}`;
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }
    current.count += 1;
    if (current.count > options.max) {
      const retry = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retry));
      return res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Too many requests — wait a moment and retry" },
      });
    }
    next();
  };
}
