import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { BadRequestError, NotFoundError } from "../lib/errors";
import { decodePolyline, pointAlongPolyline, toNumber } from "../lib/geo";
import { publicEvent, publicJourney, publicRouteRequest } from "../lib/dto";
import { computeGoogleRoutes } from "./googleRoutesService";
import { buildDemoCandidates, DEMO_FALLBACK_MESSAGE } from "./demoFallbackService";
import { getActiveRoadConditions, tagRouteWithConditions } from "./roadConditionService";
import {
  explainSelection,
  pickWinner,
  scoreCandidates,
  shouldAdoptReroute,
  candidateBreakdown,
} from "./routeScoringService";

const TICK_PROGRESS = 0.008;

async function loadJourney(id: string) {
  const journey = await prisma.journey.findUnique({
    where: { id },
    include: {
      emergency: { include: { vehicle: true } },
      vehicle: true,
      selection: {
        include: {
          candidate: true,
          request: {
            include: {
              candidates: { orderBy: { providerRouteIndex: "asc" } },
              selection: { include: { candidate: true } },
            },
          },
        },
      },
      events: { orderBy: { occurredAt: "desc" }, take: 40 },
    },
  });
  if (!journey) throw new NotFoundError("Journey not found");
  return journey;
}

export async function getJourney(id: string) {
  const journey = await loadJourney(id);
  return serializeJourney(journey);
}

function serializeJourney(journey: Awaited<ReturnType<typeof loadJourney>>) {
  const progress = toNumber(journey.progress);
  const remaining = 1 - progress;
  const routeEtaSeconds = journey.selection.candidate.etaSeconds;
  const arrivalMs = journey.estimatedArrivalAt.getTime();
  const remainingSeconds = Math.max(0, Math.round((arrivalMs - Date.now()) / 1000));
  return {
    journey: {
      ...publicJourney(journey),
      remainingMeters: Math.round(journey.selection.candidate.distanceMeters * remaining),
      remainingSeconds,
      routeEtaSeconds,
      currentRouteLabel: journey.selection.candidate.label,
    },
    emergency: {
      id: journey.emergency.id,
      code: journey.emergency.code,
      priority: journey.emergency.priority,
      status: journey.emergency.status,
      originLabel: journey.emergency.originLabel,
      originLat: toNumber(journey.emergency.originLat),
      originLng: toNumber(journey.emergency.originLng),
      destinationLabel: journey.emergency.destinationLabel,
      destinationLat: toNumber(journey.emergency.destinationLat),
      destinationLng: toNumber(journey.emergency.destinationLng),
    },
    vehicle: {
      id: journey.vehicle.id,
      callSign: journey.vehicle.callSign,
      type: journey.vehicle.type,
    },
    routeRequest: publicRouteRequest(journey.selection.request),
    events: journey.events.map(publicEvent),
  };
}

export async function tickJourney(id: string, steps = 1) {
  const journey = await loadJourney(id);
  if (journey.status !== "ACTIVE") {
    return serializeJourney(journey);
  }

  const polyline = journey.selection.candidate.polyline;
  const points = decodePolyline(polyline);
  let progress = toNumber(journey.progress);
  const previousBucket = Math.floor(progress / 0.25);

  progress = Math.min(1, progress + TICK_PROGRESS * steps);
  const position = pointAlongPolyline(points, progress);

  const milestoneEvents: Prisma.RouteEventCreateManyInput[] = [];
  const newBucket = Math.floor(progress / 0.25);
  if (newBucket > previousBucket && progress < 1) {
    milestoneEvents.push({
      journeyId: id,
      type: "POSITION",
      payload: {
        progress,
        lastLat: position.lat,
        lastLng: position.lng,
        note: `${Math.round(progress * 100)}% along selected route`,
      },
    });
  }

  if (progress >= 1) {
    await prisma.$transaction([
      prisma.journey.update({
        where: { id },
        data: {
          progress: 1,
          lastLat: position.lat,
          lastLng: position.lng,
          status: "COMPLETED",
          estimatedArrivalAt: new Date(),
        },
      }),
      prisma.emergency.update({
        where: { id: journey.emergencyId },
        data: { status: "COMPLETED" },
      }),
      prisma.emergencyVehicle.update({
        where: { id: journey.vehicleId },
        data: {
          status: "AVAILABLE",
          assignedEmergencyId: null,
          latitude: position.lat,
          longitude: position.lng,
        },
      }),
      prisma.routeEvent.create({
        data: {
          journeyId: id,
          type: "ARRIVED",
          payload: {
            lastLat: position.lat,
            lastLng: position.lng,
            destination: journey.emergency.destinationLabel,
          },
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.journey.update({
        where: { id },
        data: {
          progress,
          lastLat: position.lat,
          lastLng: position.lng,
        },
      }),
      prisma.emergencyVehicle.update({
        where: { id: journey.vehicleId },
        data: { latitude: position.lat, longitude: position.lng },
      }),
      ...(milestoneEvents.length
        ? [
            prisma.routeEvent.createMany({ data: milestoneEvents }),
          ]
        : []),
    ]);
  }

  return getJourney(id);
}

export async function listActiveJourneys() {
  const journeys = await prisma.journey.findMany({
    where: { status: "ACTIVE" },
    include: {
      emergency: true,
      vehicle: true,
      selection: { include: { candidate: true } },
    },
    orderBy: { startedAt: "desc" },
  });
  return journeys.map((journey) => ({
    id: journey.id,
    emergencyCode: journey.emergency.code,
    origin: journey.emergency.originLabel,
    destination: journey.emergency.destinationLabel,
    vehicleCallSign: journey.vehicle.callSign,
    routeLabel: journey.selection.candidate.label,
    progress: toNumber(journey.progress),
    etaSeconds: journey.selection.candidate.etaSeconds,
  }));
}

export async function listEvents(id: string) {
  await loadJourney(id);
  const events = await prisma.routeEvent.findMany({
    where: { journeyId: id },
    orderBy: { occurredAt: "desc" },
  });
  return events.map(publicEvent);
}

export async function evaluateReroute(
  journeyId: string,
  options: { force?: boolean; forceDemo?: boolean; reason?: string } = {},
) {
  const journey = await loadJourney(journeyId);
  if (journey.status !== "ACTIVE") {
    throw new BadRequestError("Only an active journey can be rerouted");
  }

  const origin = {
    lat: toNumber(journey.lastLat),
    lng: toNumber(journey.lastLng),
  };
  const destination = {
    lat: toNumber(journey.emergency.destinationLat),
    lng: toNumber(journey.emergency.destinationLng),
  };

  await prisma.routeEvent.create({
    data: {
      journeyId,
      type: "REROUTE_TRIGGERED",
      payload: {
        reason: options.reason ?? "Dispatcher or road-condition change requested a recalculation",
        from: origin,
      },
    },
  });

  const computed = options.forceDemo
    ? { ok: false as const, reason: "Dispatcher requested DEMO SIMULATION" }
    : await computeGoogleRoutes(origin, destination, { bypassCache: true, ensureAlternate: true });

  const usingDemo = !computed.ok;
  const rawRoutes = usingDemo ? buildDemoCandidates(origin, destination) : computed.routes;
  const conditions = await getActiveRoadConditions();
  const tagged = await Promise.all(
    rawRoutes.map(async (route) => ({ ...route, ...(await tagRouteWithConditions(route, conditions)) })),
  );
  const scored = scoreCandidates(tagged, journey.emergency.priority);
  const winner = pickWinner(scored);
  const explanation = explainSelection(scored, winner, journey.emergency.priority);

  const request = await prisma.routeRequest.create({
    data: {
      emergencyId: journey.emergencyId,
      originLabel: `${journey.vehicle.callSign} current position`,
      originLat: origin.lat,
      originLng: origin.lng,
      destinationLabel: journey.emergency.destinationLabel,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      provider: usingDemo ? "DEMO" : "GOOGLE",
      providerStatus: usingDemo ? "FALLBACK" : "OK",
      providerMessage: usingDemo
        ? `${DEMO_FALLBACK_MESSAGE} (${"reason" in computed ? computed.reason : "demo"})`
        : null,
    },
  });

  const createdCandidates = await Promise.all(
    scored.map((candidate) =>
      prisma.routeCandidate.create({
        data: {
          requestId: request.id,
          providerRouteIndex: (candidate as { providerRouteIndex: number }).providerRouteIndex,
          label: candidate.label,
          polyline: (candidate as { polyline: string }).polyline,
          etaSeconds: candidate.etaSeconds,
          distanceMeters: candidate.distanceMeters,
          trafficLevel: candidate.trafficLevel,
          roadImpact: candidate.roadImpact,
          blocked: candidate.blocked,
          score: candidate.score,
          corridorIds: ((candidate as { corridorIds?: string[] }).corridorIds ??
            []) as Prisma.InputJsonValue,
          breakdown: candidateBreakdown(candidate) as Prisma.InputJsonValue,
        },
      }),
    ),
  );

  await prisma.routeEvent.create({
    data: {
      journeyId,
      type: "ROUTE_RECALCULATED",
      payload: {
        requestId: request.id,
        candidateCount: createdCandidates.length,
        eligibleCount: scored.filter((c) => c.eligible).length,
        dataSource: usingDemo ? "DEMO SIMULATION" : "GOOGLE ROUTES",
      },
    },
  });

  const current = {
    score: journey.selection.candidate.score ? toNumber(journey.selection.candidate.score) : null,
    etaSeconds: Math.round(
      journey.selection.candidate.etaSeconds * (1 - toNumber(journey.progress)),
    ),
    blocked: journey.selection.candidate.blocked || journey.selection.candidate.roadImpact === "BLOCKED",
  };

  // Re-tag the *current* remaining route against latest conditions.
  const currentImpact = await tagRouteWithConditions(
    {
      providerRouteIndex: journey.selection.candidate.providerRouteIndex,
      label: journey.selection.candidate.label,
      polyline: journey.selection.candidate.polyline,
      etaSeconds: current.etaSeconds,
      distanceMeters: journey.selection.candidate.distanceMeters,
      trafficLevel: journey.selection.candidate.trafficLevel,
      corridorIds: (journey.selection.candidate.corridorIds as string[]) ?? [],
    },
    conditions,
  );
  current.blocked = currentImpact.blocked;

  if (!winner) {
    await prisma.routeEvent.create({
      data: {
        journeyId,
        type: "REROUTE_DECLINED",
        payload: {
          reason: "No eligible replacement route after blocked-road exclusion",
          explanation,
        },
      },
    });
    return {
      adopted: false,
      reason: "No eligible replacement route",
      explanation,
      currentBlocked: current.blocked,
      request: publicRouteRequest(
        (await prisma.routeRequest.findUnique({
          where: { id: request.id },
          include: {
            candidates: { orderBy: { providerRouteIndex: "asc" } },
            selection: { include: { candidate: true } },
          },
        }))!,
      ),
      journey: await getJourney(journeyId),
    };
  }

  const winnerRow = createdCandidates.find((row) => row.label === winner.label)!;
  const decision = options.force
    ? { adopt: true, reason: options.reason ?? "Admin forced reroute" }
    : shouldAdoptReroute(current, {
        score: winner.score,
        etaSeconds: winner.etaSeconds,
        blocked: winner.blocked,
      });

  if (!decision.adopt) {
    await prisma.routeEvent.create({
      data: {
        journeyId,
        type: "REROUTE_DECLINED",
        payload: { reason: decision.reason, explanation },
      },
    });
    return {
      adopted: false,
      reason: decision.reason,
      explanation,
      currentBlocked: current.blocked,
      request: publicRouteRequest(
        (await prisma.routeRequest.findUnique({
          where: { id: request.id },
          include: {
            candidates: { orderBy: { providerRouteIndex: "asc" } },
            selection: { include: { candidate: true } },
          },
        }))!,
      ),
      journey: await getJourney(journeyId),
    };
  }

  const selection = await prisma.routeSelection.create({
    data: {
      requestId: request.id,
      candidateId: winnerRow.id,
      selectedBy: "ENGINE",
      reason: {
        ...explanation,
        previousSelectionId: journey.selectionId,
        previousEtaSeconds: current.etaSeconds,
        newEtaSeconds: winner.etaSeconds,
        adoptReason: decision.reason,
      } as Prisma.InputJsonValue,
    },
  });

  const oldEta = current.etaSeconds;
  await prisma.$transaction([
    prisma.journey.update({
      where: { id: journeyId },
      data: {
        selectionId: selection.id,
        estimatedArrivalAt: new Date(Date.now() + winner.etaSeconds * 1000),
        progress: 0,
      },
    }),
    prisma.routeEvent.create({
      data: {
        journeyId,
        type: "REROUTED",
        payload: {
          reason: decision.reason,
          previousRoute: journey.selection.candidate.label,
          newRoute: winner.label,
          previousEtaSeconds: oldEta,
          newEtaSeconds: winner.etaSeconds,
          previousScore: current.score,
          newScore: winner.score,
          currentBlocked: current.blocked,
          dataSource: usingDemo ? "DEMO SIMULATION" : "GOOGLE ROUTES",
        },
      },
    }),
  ]);

  return {
    adopted: true,
    reason: decision.reason,
    explanation,
    currentBlocked: current.blocked,
    previousEtaSeconds: oldEta,
    newEtaSeconds: winner.etaSeconds,
    request: publicRouteRequest(
      (await prisma.routeRequest.findUnique({
        where: { id: request.id },
        include: {
          candidates: { orderBy: { providerRouteIndex: "asc" } },
          selection: { include: { candidate: true } },
        },
      }))!,
    ),
    journey: await getJourney(journeyId),
  };
}

export async function rerouteActiveJourneysAffectedBy(corridorId: string, status: string) {
  const active = await prisma.journey.findMany({
    where: { status: "ACTIVE" },
    include: { selection: { include: { candidate: true } } },
  });

  const results = [];
  for (const journey of active) {
    const corridorIds = (journey.selection.candidate.corridorIds as string[]) ?? [];
    const geometry = journey.selection.candidate.polyline;
    const conditions = await getActiveRoadConditions();
    const impact = await tagRouteWithConditions(
      {
        providerRouteIndex: 0,
        label: journey.selection.candidate.label,
        polyline: geometry,
        etaSeconds: journey.selection.candidate.etaSeconds,
        distanceMeters: journey.selection.candidate.distanceMeters,
        trafficLevel: journey.selection.candidate.trafficLevel,
        corridorIds,
      },
      conditions,
    );

    if (impact.blocked || corridorIds.includes(corridorId) || status !== "CLEAR") {
      if (impact.blocked || corridorIds.includes(corridorId)) {
        results.push(
          await evaluateReroute(journey.id, {
            reason: `Road condition on ${corridorId} changed to ${status}`,
          }),
        );
      }
    }
  }
  return results;
}
