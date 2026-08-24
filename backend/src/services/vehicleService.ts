import type { IncidentType, Prisma, VehicleStatus, VehicleType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { BadRequestError, NotFoundError } from "../lib/errors";
import { formatDistance, haversineMeters, toNumber, type LatLng } from "../lib/geo";
import { publicVehicle } from "../lib/dto";

export function requiredVehicleType(incidentType?: IncidentType | string): VehicleType {
  if (incidentType === "FIRE") return "FIRE";
  if (incidentType === "POLICE") return "POLICE";
  return "AMBULANCE";
}

export async function listVehicles(filters?: { status?: VehicleStatus; type?: VehicleType }) {
  const vehicles = await prisma.emergencyVehicle.findMany({
    where: {
      status: filters?.status,
      type: filters?.type,
    },
    orderBy: { callSign: "asc" },
  });
  return vehicles.map(publicVehicle);
}

export async function getVehicle(id: string) {
  const vehicle = await prisma.emergencyVehicle.findUnique({ where: { id } });
  if (!vehicle) throw new NotFoundError("Vehicle not found");
  return publicVehicle(vehicle);
}

export async function createVehicle(input: {
  callSign: string;
  type: VehicleType;
  latitude: number;
  longitude: number;
  locationLabel: string;
  status?: VehicleStatus;
  capabilities?: Record<string, unknown>;
}) {
  const vehicle = await prisma.emergencyVehicle.create({
    data: {
      callSign: input.callSign.toUpperCase(),
      type: input.type,
      latitude: input.latitude,
      longitude: input.longitude,
      locationLabel: input.locationLabel,
      status: input.status ?? "AVAILABLE",
      capabilities: (input.capabilities ?? { als: true, stretcher: true }) as Prisma.InputJsonValue,
    },
  });
  return publicVehicle(vehicle);
}

export async function updateVehicle(
  id: string,
  input: Partial<{
    callSign: string;
    type: VehicleType;
    latitude: number;
    longitude: number;
    locationLabel: string;
    status: VehicleStatus;
    capabilities: Record<string, unknown>;
  }>,
) {
  const existing = await prisma.emergencyVehicle.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Vehicle not found");

  if (input.status === "AVAILABLE" && existing.assignedEmergencyId) {
    throw new BadRequestError("Release the assigned emergency before marking the vehicle available");
  }

  const vehicle = await prisma.emergencyVehicle.update({
    where: { id },
    data: {
      callSign: input.callSign?.toUpperCase(),
      type: input.type,
      latitude: input.latitude,
      longitude: input.longitude,
      locationLabel: input.locationLabel,
      status: input.status,
      capabilities: input.capabilities as Prisma.InputJsonValue | undefined,
    },
  });
  return publicVehicle(vehicle);
}

export async function recommendVehicles(
  origin: LatLng,
  options?: { type?: VehicleType; incidentType?: IncidentType | string; priority?: string },
) {
  const type = options?.type ?? requiredVehicleType(options?.incidentType);
  const vehicles = await prisma.emergencyVehicle.findMany({
    where: { status: "AVAILABLE", type },
  });

  const ranked = vehicles
    .map((vehicle) => {
      const point = {
        lat: toNumber(vehicle.latitude),
        lng: toNumber(vehicle.longitude),
      };
      const distanceMeters = Math.round(haversineMeters(origin, point));
      const als = Boolean((vehicle.capabilities as { als?: boolean } | null)?.als);
      return {
        ...publicVehicle(vehicle),
        distanceMeters,
        als,
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  if (ranked.length === 0) return [];

  const nearest = ranked[0];
  let chosenIndex = 0;
  if (options?.priority === "CRITICAL") {
    const alsNearby = ranked.findIndex(
      (vehicle) => vehicle.als && vehicle.distanceMeters <= nearest.distanceMeters * 1.5 + 400,
    );
    if (alsNearby >= 0) chosenIndex = alsNearby;
  }

  return ranked.map((vehicle, index) => {
    const recommended = index === chosenIndex;
    let reason = `${formatDistance(vehicle.distanceMeters)} from the incident at ${vehicle.locationLabel}.`;
    if (recommended && index === 0) {
      reason = `Nearest available ${vehicle.type.toLowerCase()} — ${reason}`;
    } else if (recommended) {
      reason = `Preferred for ${options?.priority ?? "this"} incident: ALS-equipped and still close (${reason})`;
    } else {
      reason = `Available ${vehicle.type.toLowerCase()} — ${reason}`;
    }
    return {
      ...vehicle,
      recommended,
      reason,
    };
  }).sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.distanceMeters - b.distanceMeters)
    .map((vehicle, index) => ({ ...vehicle, rank: index + 1 }));
}

export async function deleteVehicle(id: string) {
  const existing = await prisma.emergencyVehicle.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Vehicle not found");
  if (existing.status === "ASSIGNED" || existing.assignedEmergencyId) {
    throw new BadRequestError("Cannot delete a vehicle that is assigned to an emergency");
  }
  await prisma.emergencyVehicle.delete({ where: { id } });
}
