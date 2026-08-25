import type { EmergencyPriority, IncidentType, Prisma, SelectedBy } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { BadRequestError, NotFoundError } from "../lib/errors";
import { publicEmergency, publicRouteRequest } from "../lib/dto";
import { toNumber, type LatLng } from "../lib/geo";
import { computeGoogleRoutes } from "./googleRoutesService";
import { buildDemoCandidates, DEMO_FALLBACK_MESSAGE } from "./demoFallbackService";
import { getActiveRoadConditions, tagRouteWithConditions } from "./roadConditionService";
import {
  candidateBreakdown,
  explainSelection,
  pickWinner,
  scoreCandidates,
} from "./routeScoringService";
import { recommendVehicles } from "./vehicleService";

function nextEmergencyCode() {
  const now = new Date();
  const stamp = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RR-${stamp}-${rand}`;
}

export async function listEmergencies() {
  const emergencies = await prisma.emergency.findMany({
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return emergencies.map(publicEmergency);
}

export async function getEmergency(id: string) {
  const emergency = await prisma.emergency.findUnique({
    where: { id },
    include: {
      vehicle: true,
      journey: true,
      routeRequests: {
        orderBy: { requestedAt: "desc" },
        take: 1,
        include: {
          candidates: { orderBy: { providerRouteIndex: "asc" } },
          selection: { include: { candidate: true } },
        },
      },
    },
  });
  if (!emergency) throw new NotFoundError("Emergency not found");

  const recommended = await recommendVehicles(
    {
      lat: toNumber(emergency.originLat),
      lng: toNumber(emergency.originLng),
    },
    { incidentType: emergency.incidentType, priority: emergency.priority },
  );

  return {
    emergency: publicEmergency(emergency),
    recommendedVehicles: recommended,
    latestRouteRequest: emergency.routeRequests[0]
      ? publicRouteRequest(emergency.routeRequests[0])
      : null,
    journeyId: emergency.journey?.id ?? null,
  };
}

export async function createEmergency(
  createdById: string,
  input: {
    incidentType?: IncidentType;
    priority: EmergencyPriority;
    originLabel: string;
    originLat: number;
    originLng: number;
    destinationLabel: string;
    destinationLat: number;
    destinationLng: number;
    notes?: string;
  },
) {
  const emergency = await prisma.emergency.create({
    data: {
      code: nextEmergencyCode(),
      incidentType: input.incidentType ?? "MEDICAL",
      priority: input.priority,
      originLabel: input.originLabel,
      originLat: input.originLat,
      originLng: input.originLng,
      destinationLabel:
        input.incidentType === "FIRE" || input.incidentType === "POLICE"
          ? input.destinationLabel || input.originLabel
          : input.destinationLabel,
      destinationLat:
        input.incidentType === "FIRE" || input.incidentType === "POLICE"
          ? input.destinationLat || input.originLat
          : input.destinationLat,
      destinationLng:
        input.incidentType === "FIRE" || input.incidentType === "POLICE"
          ? input.destinationLng || input.originLng
          : input.destinationLng,
      notes: input.notes ?? "",
      createdById,
    },
    include: { vehicle: true },
  });
  return publicEmergency(emergency);
}

export async function assignVehicle(emergencyId: string, vehicleId?: string) {
  const emergency = await prisma.emergency.findUnique({
    where: { id: emergencyId },
    include: { vehicle: true },
  });
  if (!emergency) throw new NotFoundError("Emergency not found");
  if (emergency.status === "COMPLETED" || emergency.status === "CANCELLED") {
    throw new BadRequestError("Cannot assign a vehicle to a closed emergency");
  }

  let chosenId = vehicleId;
  if (!chosenId) {
    const recommended = await recommendVehicles(
      {
        lat: toNumber(emergency.originLat),
        lng: toNumber(emergency.originLng),
      },
      { incidentType: emergency.incidentType, priority: emergency.priority },
    );
    if (recommended.length === 0) {
      throw new BadRequestError("No available compatible vehicles");
    }
    chosenId = recommended[0].id;
  }

  const vehicle = await prisma.emergencyVehicle.findUnique({ where: { id: chosenId } });
  if (!vehicle) throw new NotFoundError("Vehicle not found");
  if (vehicle.status !== "AVAILABLE") {
    throw new BadRequestError(`${vehicle.callSign} is not available`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (emergency.vehicle) {
      await tx.emergencyVehicle.update({
        where: { id: emergency.vehicle.id },
        data: { status: "AVAILABLE", assignedEmergencyId: null },
      });
    }

    const claimed = await tx.emergencyVehicle.updateMany({
      where: { id: vehicle.id, status: "AVAILABLE" },
      data: { status: "ASSIGNED", assignedEmergencyId: emergencyId },
    });
    if (claimed.count !== 1) {
      throw new BadRequestError(`${vehicle.callSign} was just assigned to another incident`);
    }

    return tx.emergency.update({
      where: { id: emergencyId },
      data: { status: emergency.status === "OPEN" ? "ASSIGNED" : emergency.status },
      include: { vehicle: true },
    });
  });

  const withVehicle = await prisma.emergency.findUnique({
    where: { id: updated.id },
    include: { vehicle: true },
  });
  return publicEmergency(withVehicle!);
}

export async function calculateRoutes(emergencyId: string, forceDemo = false) {
  const emergency = await prisma.emergency.findUnique({
    where: { id: emergencyId },
    include: { vehicle: true },
  });
  if (!emergency) throw new NotFoundError("Emergency not found");

  const scene: LatLng = {
    lat: toNumber(emergency.originLat),
    lng: toNumber(emergency.originLng),
  };
  const toScene =
    emergency.incidentType === "FIRE" || emergency.incidentType === "POLICE";
  const origin: LatLng =
    toScene && emergency.vehicle
      ? { lat: toNumber(emergency.vehicle.latitude), lng: toNumber(emergency.vehicle.longitude) }
      : scene;
  const destination: LatLng = {
    lat: toNumber(emergency.destinationLat),
    lng: toNumber(emergency.destinationLng),
  };
  const originLabel =
    toScene && emergency.vehicle
      ? `${emergency.vehicle.callSign} · ${emergency.vehicle.locationLabel}`
      : emergency.originLabel;

  const computed = forceDemo
    ? { ok: false as const, reason: "Dispatcher requested DEMO SIMULATION" }
    : await computeGoogleRoutes(origin, destination);

  const usingDemo = !computed.ok;
  const rawRoutes = usingDemo ? buildDemoCandidates(origin, destination) : computed.routes;
  const conditions = await getActiveRoadConditions();

  const tagged = await Promise.all(
    rawRoutes.map(async (route) => {
      const impact = await tagRouteWithConditions(route, conditions);
      return { ...route, ...impact };
    }),
  );

  const scored = scoreCandidates(tagged, emergency.priority);
  const winner = pickWinner(scored);
  const explanation = explainSelection(scored, winner, emergency.priority);

  const request = await prisma.routeRequest.create({
    data: {
      emergencyId,
      originLabel,
      originLat: origin.lat,
      originLng: origin.lng,
      destinationLabel: emergency.destinationLabel,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      provider: usingDemo ? "DEMO" : "GOOGLE",
      providerStatus: usingDemo ? "FALLBACK" : "OK",
      providerMessage: usingDemo
        ? "reason" in computed
          ? `${DEMO_FALLBACK_MESSAGE} (${computed.reason})`
          : DEMO_FALLBACK_MESSAGE
        : null,
    },
  });

  const createdCandidates = await Promise.all(
    scored.map((candidate) =>
      prisma.routeCandidate.create({
        data: {
          requestId: request.id,
          providerRouteIndex: candidate.providerRouteIndex,
          label: candidate.label,
          polyline: candidate.polyline,
          etaSeconds: candidate.etaSeconds,
          distanceMeters: candidate.distanceMeters,
          trafficLevel: candidate.trafficLevel,
          roadImpact: candidate.roadImpact,
          blocked: candidate.blocked,
          score: candidate.score,
          corridorIds: candidate.corridorIds as Prisma.InputJsonValue,
          breakdown: candidateBreakdown(candidate) as Prisma.InputJsonValue,
        },
      }),
    ),
  );

  let selection = null;
  if (winner) {
    const winnerRow = createdCandidates.find(
      (row) => row.providerRouteIndex === winner.providerRouteIndex,
    );
    if (winnerRow) {
      selection = await prisma.routeSelection.create({
        data: {
          requestId: request.id,
          candidateId: winnerRow.id,
          selectedBy: "ENGINE",
          reason: explanation as Prisma.InputJsonValue,
          version: 1,
        },
      });
    }
  }

  const full = await prisma.routeRequest.findUnique({
    where: { id: request.id },
    include: {
      candidates: { orderBy: { providerRouteIndex: "asc" } },
      selection: { include: { candidate: true } },
    },
  });

  return {
    ...publicRouteRequest(full!),
    explanation,
    noEligibleRoute: winner == null,
    selectionId: selection?.id ?? null,
  };
}

export async function selectCandidate(
  emergencyId: string,
  candidateId: string,
  selectedBy: SelectedBy = "DISPATCHER",
) {
  const candidate = await prisma.routeCandidate.findUnique({
    where: { id: candidateId },
    include: { request: true },
  });
  if (!candidate || candidate.request.emergencyId !== emergencyId) {
    throw new NotFoundError("Candidate not found for this emergency");
  }
  if (candidate.blocked) {
    throw new BadRequestError("Cannot select a blocked route");
  }

  const existing = await prisma.routeSelection.findUnique({
    where: { requestId: candidate.requestId },
  });

  const reason = {
    summary: `Dispatcher overrode the engine and selected ${candidate.label}.`,
    factors: ["Manual dispatcher selection"],
    selectedCandidateId: candidate.id,
  };

  const selection = existing
    ? await prisma.routeSelection.update({
        where: { id: existing.id },
        data: {
          candidateId,
          selectedBy,
          reason: reason as Prisma.InputJsonValue,
          version: existing.version + 1,
        },
        include: { candidate: true, request: true },
      })
    : await prisma.routeSelection.create({
        data: {
          requestId: candidate.requestId,
          candidateId,
          selectedBy,
          reason: reason as Prisma.InputJsonValue,
        },
        include: { candidate: true, request: true },
      });

  return selection;
}

export async function dispatchEmergency(emergencyId: string, candidateId?: string) {
  const emergency = await prisma.emergency.findUnique({
    where: { id: emergencyId },
    include: { vehicle: true, journey: true },
  });
  if (!emergency) throw new NotFoundError("Emergency not found");
  if (!emergency.vehicle) throw new BadRequestError("Assign a vehicle before dispatch");
  if (emergency.journey) throw new BadRequestError("This emergency already has a journey");

  if (candidateId) {
    await selectCandidate(emergencyId, candidateId, "DISPATCHER");
  }

  const latest = await prisma.routeRequest.findFirst({
    where: { emergencyId },
    orderBy: { requestedAt: "desc" },
    include: { selection: { include: { candidate: true } }, candidates: true },
  });
  if (!latest?.selection?.candidate) {
    throw new BadRequestError("Calculate an eligible route before dispatch");
  }
  if (latest.selection.candidate.blocked) {
    throw new BadRequestError("The selected route is blocked");
  }

  const candidate = latest.selection.candidate;
  const start = {
    lat: toNumber(emergency.vehicle.latitude),
    lng: toNumber(emergency.vehicle.longitude),
  };
  const eta = new Date(Date.now() + candidate.etaSeconds * 1000);

  const journey = await prisma.$transaction(async (tx) => {
    const created = await tx.journey.create({
      data: {
        emergencyId,
        vehicleId: emergency.vehicle!.id,
        selectionId: latest.selection!.id,
        status: "ACTIVE",
        estimatedArrivalAt: eta,
        lastLat: start.lat,
        lastLng: start.lng,
        progress: 0,
      },
    });
    await tx.emergency.update({
      where: { id: emergencyId },
      data: { status: "DISPATCHED" },
    });
    await tx.routeEvent.create({
      data: {
        journeyId: created.id,
        type: "DISPATCHED",
        payload: {
          vehicleCallSign: emergency.vehicle!.callSign,
          routeLabel: candidate.label,
          etaSeconds: candidate.etaSeconds,
          score: candidate.score ? toNumber(candidate.score) : null,
          dataSource: latest.provider === "DEMO" ? "DEMO SIMULATION" : "GOOGLE ROUTES",
        } as Prisma.InputJsonValue,
      },
    });
    return created;
  });

  return journey;
}
