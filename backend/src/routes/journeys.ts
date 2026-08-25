import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { rerouteSchema, tickSchema } from "../validators";
import { evaluateReroute, getJourney, listEvents, tickJourney } from "../services/journeyService";
import { subscribeJourney } from "../services/journeyTicker";
import { paramId } from "../lib/params";

export const journeysRouter = Router();

journeysRouter.use(requireAuth);

journeysRouter.get("/:id/live", async (req, res) => {
  const id = paramId(req.params.id);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`event: hello\ndata: ${JSON.stringify({ id })}\n\n`);

  const unsubscribe = subscribeJourney(id, (payload) => {
    res.write(`event: tick\ndata: ${JSON.stringify(payload)}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
    res.end();
  });
});

journeysRouter.get("/:id", async (req, res) => {
  res.json(await getJourney(paramId(req.params.id)));
});

journeysRouter.post("/:id/tick", async (req, res) => {
  const body = tickSchema.parse(req.body ?? {});
  res.json(await tickJourney(paramId(req.params.id), body.steps));
});

journeysRouter.post("/:id/reroute", async (req, res) => {
  const body = rerouteSchema.parse(req.body ?? {});
  res.json(await evaluateReroute(paramId(req.params.id), body));
});

journeysRouter.get("/:id/events", async (req, res) => {
  res.json({ events: await listEvents(paramId(req.params.id)) });
});
