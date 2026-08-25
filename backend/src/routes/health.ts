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

  const payload = {
    ok: database === "up",
    service: "rapidroute-api",
    time: new Date().toISOString(),
    database,
    googleRoutesConfigured: Boolean(env.GOOGLE_MAPS_API_KEY),
    dataSource: env.GOOGLE_MAPS_API_KEY ? "GOOGLE_ROUTES_AVAILABLE" : "DEMO_FALLBACK_ONLY",
  };

  const wantsHtml = String(_req.headers.accept ?? "").includes("text/html");
  if (wantsHtml) {
    res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><title>RapidRoute health</title>
<style>
  body{font-family:Roboto,Segoe UI,sans-serif;background:#e8edf2;margin:40px;color:#1a1a1a}
  .box{max-width:520px;background:#fff;border:1px solid #c5cdd6;padding:20px}
  h1{margin:0 0 8px;font-size:20px}
  .ok{color:#166534;font-weight:700}
  .bad{color:#b91c1c;font-weight:700}
  pre{background:#e8edf2;padding:10px;overflow:auto}
</style></head><body>
<div class="box">
  <h1>RapidRoute API</h1>
  <p class="${payload.ok ? "ok" : "bad"}">${payload.ok ? "OK — database up" : "DOWN — database unreachable"}</p>
  <p>Google Routes: ${payload.googleRoutesConfigured ? "configured" : "not configured (demo fallback)"}</p>
  <p>Open the app at <a href="http://localhost:5173">http://localhost:5173</a></p>
  <pre>${JSON.stringify(payload, null, 2)}</pre>
</div>
</body></html>`);
    return;
  }

  res.json(payload);
});
