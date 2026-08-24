import type {
  Emergency,
  EmergencyVehicle,
  Journey,
  RoadCondition,
  RouteCandidate,
  RouteEvent,
  RouteRequest,
  RouteSelection,
  User,
} from "@prisma/client";
import { formatDistance, formatDuration, toNumber } from "./geo";
import { qualityFromPenalty } from "../services/routeScoringService";

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function publicVehicle(vehicle: EmergencyVehicle) {
  return {
    id: vehicle.id,
    callSign: vehicle.callSign,
    type: vehicle.type,
    latitude: toNumber(vehicle.latitude),
    longitude: toNumber(vehicle.longitude),
    locationLabel: vehicle.locationLabel,
    status: vehicle.status,
    capabilities: vehicle.capabilities,
    assignedEmergencyId: vehicle.assignedEmergencyId,
    updatedAt: vehicle.updatedAt,
  };
}

export function publicEmergency(
  emergency: Emergency & { vehicle?: EmergencyVehicle | null },
) {
  return {
    id: emergency.id,
    code: emergency.code,
    incidentType: emergency.incidentType,
    priority: emergency.priority,
    status: emergency.status,
    originLabel: emergency.originLabel,
    originLat: toNumber(emergency.originLat),
    originLng: toNumber(emergency.originLng),
    destinationLabel: emergency.destinationLabel,
    destinationLat: toNumber(emergency.destinationLat),
    destinationLng: toNumber(emergency.destinationLng),
    notes: emergency.notes,
    createdById: emergency.createdById,
    createdAt: emergency.createdAt,
    updatedAt: emergency.updatedAt,
    vehicle: emergency.vehicle ? publicVehicle(emergency.vehicle) : null,
  };
}

export function publicRoadCondition(condition: RoadCondition) {
  return {
    id: condition.id,
    title: condition.title,
    status: condition.status,
    corridorId: condition.corridorId,
    geometry: condition.geometry,
    simulated: condition.simulated,
    activeFrom: condition.activeFrom,
    activeUntil: condition.activeUntil,
    reportedById: condition.reportedById,
    updatedAt: condition.updatedAt,
  };
}

export function publicCandidate(candidate: RouteCandidate) {
  const penalty = candidate.score == null ? null : toNumber(candidate.score);
  return {
    id: candidate.id,
    requestId: candidate.requestId,
    providerRouteIndex: candidate.providerRouteIndex,
    label: candidate.label,
    polyline: candidate.polyline,
    etaSeconds: candidate.etaSeconds,
    etaLabel: formatDuration(candidate.etaSeconds),
    distanceMeters: candidate.distanceMeters,
    distanceLabel: formatDistance(candidate.distanceMeters),
    trafficLevel: candidate.trafficLevel,
    roadImpact: candidate.roadImpact,
    blocked: candidate.blocked,
    penalty,
    score: qualityFromPenalty(penalty),
    corridorIds: candidate.corridorIds,
    breakdown: candidate.breakdown,
  };
}

export function publicRouteRequest(
  request: RouteRequest & {
    candidates: RouteCandidate[];
    selection: (RouteSelection & { candidate?: RouteCandidate }) | null;
  },
) {
  return {
    id: request.id,
    emergencyId: request.emergencyId,
    originLabel: request.originLabel,
    originLat: toNumber(request.originLat),
    originLng: toNumber(request.originLng),
    destinationLabel: request.destinationLabel,
    destinationLat: toNumber(request.destinationLat),
    destinationLng: toNumber(request.destinationLng),
    provider: request.provider,
    providerStatus: request.providerStatus,
    providerMessage: request.providerMessage,
    requestedAt: request.requestedAt,
    dataSourceLabel:
      request.provider === "DEMO" || request.providerStatus === "FALLBACK"
        ? "DEMO SIMULATION"
        : "GOOGLE ROUTES",
    candidates: request.candidates.map(publicCandidate),
    selection: request.selection
      ? {
          id: request.selection.id,
          candidateId: request.selection.candidateId,
          selectedBy: request.selection.selectedBy,
          reason: request.selection.reason,
          version: request.selection.version,
          candidate: request.selection.candidate
            ? publicCandidate(request.selection.candidate)
            : null,
        }
      : null,
  };
}

export function publicJourney(
  journey: Journey & {
    events?: RouteEvent[];
  },
) {
  return {
    id: journey.id,
    emergencyId: journey.emergencyId,
    vehicleId: journey.vehicleId,
    selectionId: journey.selectionId,
    status: journey.status,
    startedAt: journey.startedAt,
    estimatedArrivalAt: journey.estimatedArrivalAt,
    lastLat: toNumber(journey.lastLat),
    lastLng: toNumber(journey.lastLng),
    progress: toNumber(journey.progress),
    simulatedPosition: true,
    updatedAt: journey.updatedAt,
  };
}

export function publicEvent(event: RouteEvent) {
  return {
    id: event.id,
    journeyId: event.journeyId,
    type: event.type,
    occurredAt: event.occurredAt,
    payload: event.payload,
  };
}
