import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encodePolyline } from "../src/lib/geo";

const prisma = new PrismaClient();

const marineDrive = encodePolyline([
  { lat: 18.9432, lng: 72.8232 },
  { lat: 18.956, lng: 72.821 },
  { lat: 18.969, lng: 72.814 },
  { lat: 18.982, lng: 72.811 },
  { lat: 18.994, lng: 72.813 },
]);

const eastern = encodePolyline([
  { lat: 18.938, lng: 72.835 },
  { lat: 18.95, lng: 72.842 },
  { lat: 18.97, lng: 72.845 },
  { lat: 18.99, lng: 72.848 },
]);

async function main() {
  const adminHash = await bcrypt.hash("RapidRoute!admin", 10);
  const dispatchHash = await bcrypt.hash("RapidRoute!dispatch", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@rapidroute.local" },
    update: {},
    create: {
      name: "Priya Deshmukh",
      email: "admin@rapidroute.local",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "dispatcher@rapidroute.local" },
    update: {},
    create: {
      name: "Arjun Mehta",
      email: "dispatcher@rapidroute.local",
      passwordHash: dispatchHash,
      role: "DISPATCHER",
    },
  });

  const vehicles = [
    {
      callSign: "AMB-101",
      type: "AMBULANCE" as const,
      latitude: 18.922, // Colaba — closest to Nariman Point demo origin
      longitude: 72.832,
      locationLabel: "Colaba station",
      status: "AVAILABLE" as const,
      capabilities: { als: true, stretcher: true },
    },
    {
      callSign: "AMB-102",
      type: "AMBULANCE" as const,
      latitude: 19.0178,
      longitude: 72.8478,
      locationLabel: "Dadar post",
      status: "AVAILABLE" as const,
      capabilities: { als: true, stretcher: true },
    },
    {
      callSign: "AMB-103",
      type: "AMBULANCE" as const,
      latitude: 19.0596,
      longitude: 72.8295,
      locationLabel: "Bandra West post",
      status: "AVAILABLE" as const,
      capabilities: { als: false, stretcher: true },
    },
    {
      callSign: "AMB-104",
      type: "AMBULANCE" as const,
      latitude: 19.1136,
      longitude: 72.8697,
      locationLabel: "Andheri East post",
      status: "AVAILABLE" as const,
      capabilities: { als: true, stretcher: true },
    },
    {
      callSign: "ENG-201",
      type: "FIRE" as const,
      latitude: 18.987,
      longitude: 72.825,
      locationLabel: "Worli fire station",
      status: "INACTIVE" as const,
      capabilities: { water: true },
    },
  ];

  for (const vehicle of vehicles) {
    await prisma.emergencyVehicle.upsert({
      where: { callSign: vehicle.callSign },
      update: {
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        locationLabel: vehicle.locationLabel,
        status: vehicle.status,
        assignedEmergencyId: null,
      },
      create: vehicle,
    });
  }

  const existingMarine = await prisma.roadCondition.findFirst({
    where: { corridorId: "MARINE_DRIVE" },
  });
  if (!existingMarine) {
    await prisma.roadCondition.create({
      data: {
        title: "DEMO SIMULATION — Marine Drive clear",
        status: "CLEAR",
        corridorId: "MARINE_DRIVE",
        simulated: true,
        reportedById: admin.id,
        geometry: {
          type: "corridor",
          corridorId: "MARINE_DRIVE",
          label: "Marine Drive / Worli Sea Face",
          polyline: marineDrive,
        },
      },
    });
  }

  const existingEastern = await prisma.roadCondition.findFirst({
    where: { corridorId: "EASTERN_CONNECTOR" },
  });
  if (!existingEastern) {
    await prisma.roadCondition.create({
      data: {
        title: "DEMO SIMULATION — Eastern connector advisory",
        status: "ADVISORY",
        corridorId: "EASTERN_CONNECTOR",
        simulated: true,
        reportedById: admin.id,
        geometry: {
          type: "corridor",
          corridorId: "EASTERN_CONNECTOR",
          label: "Eastern connector / JJ approach",
          polyline: eastern,
        },
      },
    });
  }

  console.log("Seeded RapidRoute demo users, vehicles, and road conditions.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
