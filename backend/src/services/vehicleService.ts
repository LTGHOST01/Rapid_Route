import type { Prisma, VehicleStatus, VehicleType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { BadRequestError, NotFoundError } from "../lib/errors";
import { haversineMeters, toNumber, type LatLng } from "../lib/geo";
import { publicVehicle } from "../lib/dto";

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

export async function recommendVehicles(origin: LatLng, type?: VehicleType) {
  const vehicles = await prisma.emergencyVehicle.findMany({
    where: { status: "AVAILABLE", type: type ?? "AMBULANCE" },
  });

  return vehicles
    .map((vehicle) => {
      const point = {
        lat: toNumber(vehicle.latitude),
        lng: toNumber(vehicle.longitude),
      };
      return {
        ...publicVehicle(vehicle),
        distanceMeters: Math.round(haversineMeters(origin, point)),
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
