import type { Prisma, RoadStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import { publicRoadCondition } from "../lib/dto";
import { routeIntersectsGeometry, type LatLng } from "../lib/geo";
import type { NormalizedRoute } from "./demoFallbackService";

export type ConditionGeometry = {
  type?: string;
  corridorId?: string;
  label?: string;
  polyline?: string;
  points?: LatLng[];
};

export async function listRoadConditions(activeOnly = false) {
  const now = new Date();
  const conditions = await prisma.roadCondition.findMany({
    where: activeOnly
      ? {
          AND: [
            { OR: [{ activeUntil: null }, { activeUntil: { gt: now } }] },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
  });
  return conditions.map(publicRoadCondition);
}

export async function getActiveRoadConditions() {
  const now = new Date();
  return prisma.roadCondition.findMany({
    where: {
      OR: [{ activeUntil: null }, { activeUntil: { gt: now } }],
    },
  });
}

export async function createRoadCondition(input: {
  title: string;
  status: RoadStatus;
  corridorId: string;
  geometry?: ConditionGeometry;
  simulated?: boolean;
  activeUntil?: string | null;
  reportedById?: string;
}) {
  const condition = await prisma.roadCondition.create({
    data: {
      title: input.title,
      status: input.status,
      corridorId: input.corridorId,
      simulated: input.simulated ?? true,
      activeUntil: input.activeUntil ? new Date(input.activeUntil) : null,
      reportedById: input.reportedById,
      geometry: (input.geometry ?? {
        type: "corridor",
        corridorId: input.corridorId,
        label: input.title,
      }) as Prisma.InputJsonValue,
    },
  });
  return publicRoadCondition(condition);
}

export async function updateRoadCondition(
  id: string,
  input: Partial<{
    title: string;
    status: RoadStatus;
    corridorId: string;
    geometry: ConditionGeometry;
    simulated: boolean;
    activeUntil: string | null;
  }>,
) {
  const existing = await prisma.roadCondition.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Road condition not found");

  const condition = await prisma.roadCondition.update({
    where: { id },
    data: {
      title: input.title,
      status: input.status,
      corridorId: input.corridorId,
      simulated: input.simulated,
      activeUntil:
        input.activeUntil === undefined
          ? undefined
          : input.activeUntil
            ? new Date(input.activeUntil)
            : null,
      geometry: input.geometry as Prisma.InputJsonValue | undefined,
    },
  });
  return publicRoadCondition(condition);
}

export function tagRouteWithConditions(
  route: NormalizedRoute,
  conditions: Array<{
    id: string;
    status: RoadStatus;
    corridorId: string;
    geometry: Prisma.JsonValue;
  }>,
): {
  roadImpact: RoadStatus;
  blocked: boolean;
  roadConditionIds: string[];
} {
  const matching = conditions.filter((condition) => {
    if (route.corridorIds.includes(condition.corridorId)) return true;
    const geometry = (condition.geometry ?? {}) as ConditionGeometry;
    if (geometry.polyline || geometry.points?.length) {
      return routeIntersectsGeometry(route.polyline, geometry);
    }
    return false;
  });

  const rank: Record<RoadStatus, number> = {
    CLEAR: 0,
    ADVISORY: 1,
    CONGESTED: 2,
    BLOCKED: 3,
  };

  let worst: RoadStatus = "CLEAR";
  for (const condition of matching) {
    if (rank[condition.status] > rank[worst]) worst = condition.status;
  }

  return {
    roadImpact: worst,
    blocked: worst === "BLOCKED",
    roadConditionIds: matching.map((c) => c.id),
  };
}

export async function upsertDemoScenario(input: {
  status: Extract<RoadStatus, "CLEAR" | "CONGESTED" | "BLOCKED">;
  corridorId: string;
  reportedById?: string;
}) {
  const titles: Record<typeof input.status, string> = {
    CLEAR: "DEMO SIMULATION — corridor clear",
    CONGESTED: "DEMO SIMULATION — corridor congested",
    BLOCKED: "DEMO SIMULATION — corridor blocked",
  };

  const existing = await prisma.roadCondition.findFirst({
    where: { corridorId: input.corridorId, simulated: true },
    orderBy: { updatedAt: "desc" },
  });

  const geometry = existing?.geometry ?? {
    type: "corridor",
    corridorId: input.corridorId,
    label: input.corridorId,
  };

  if (existing) {
    return publicRoadCondition(
      await prisma.roadCondition.update({
        where: { id: existing.id },
        data: {
          title: titles[input.status],
          status: input.status,
          simulated: true,
          activeUntil: null,
          geometry: geometry as Prisma.InputJsonValue,
        },
      }),
    );
  }

  return createRoadCondition({
    title: titles[input.status],
    status: input.status,
    corridorId: input.corridorId,
    geometry: geometry as ConditionGeometry,
    simulated: true,
    reportedById: input.reportedById,
  });
}
