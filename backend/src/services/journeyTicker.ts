import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { tickJourney } from "./journeyService";

const TICK_MS = 4000;
type Listener = (payload: unknown) => void;

const listeners = new Map<string, Set<Listener>>();
let timer: NodeJS.Timeout | null = null;

export function startJourneyTicker() {
  if (timer) return;
  timer = setInterval(() => {
    void tickActiveJourneys();
  }, TICK_MS);
  logger.info("Journey ticker started", { everyMs: TICK_MS });
}

export function subscribeJourney(id: string, listener: Listener) {
  const set = listeners.get(id) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(id, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(id);
  };
}

async function tickActiveJourneys() {
  try {
    const active = await prisma.journey.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    for (const journey of active) {
      const detail = await tickJourney(journey.id, 1);
      const set = listeners.get(journey.id);
      if (!set) continue;
      for (const listener of set) listener(detail);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    if (!reason.includes("Can't reach database")) {
      logger.warn("Journey ticker failed", { reason: reason.slice(0, 180) });
    }
  }
}
