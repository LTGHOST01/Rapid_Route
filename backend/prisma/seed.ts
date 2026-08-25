import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encodePolyline } from "../src/lib/geo";
import { DETERMINISTIC_DEMO } from "../src/lib/locations";

const prisma = new PrismaClient();

const sionLink = encodePolyline([
  { lat: 19.0178, lng: 72.8478 },
  { lat: 19.012, lng: 72.846 },
  { lat: 19.007, lng: 72.844 },
  { lat: 19.0022, lng: 72.8416 },
]);

const eastern = encodePolyline([
  { lat: 19.0178, lng: 72.8478 },
  { lat: 19.02, lng: 72.855 },
  { lat: 19.015, lng: 72.86 },
  { lat: 19.008, lng: 72.852 },
  { lat: 19.0022, lng: 72.8416 },
]);

const kurlaCongestion = encodePolyline([
  { lat: 19.0726, lng: 72.8845 },
  { lat: 19.065, lng: 72.878 },
  { lat: 19.055, lng: 72.87 },
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
      latitude: 19.0178,
      longitude: 72.8478,
      locationLabel: "Dadar post",
      status: "AVAILABLE" as const,
      capabilities: { als: true, stretcher: true },
    },
    {
      callSign: "AMB-102",
      type: "AMBULANCE" as const,
      latitude: 19.043,
      longitude: 72.863,
      locationLabel: "Sion post",
      status: "AVAILABLE" as const,
      capabilities: { als: true, stretcher: true },
    },
    {
      callSign: "AMB-103",
      type: "AMBULANCE" as const,
      latitude: 19.0726,
      longitude: 72.8845,
      locationLabel: "Kurla post",
      status: "AVAILABLE" as const,
      capabilities: { als: false, stretcher: true },
    },
    {
      callSign: "AMB-104",
      type: "AMBULANCE" as const,
      latitude: 18.9696,
      longitude: 72.8193,
      locationLabel: "Mumbai Central post",
      status: "AVAILABLE" as const,
      capabilities: { als: true, stretcher: true },
    },
    {
      callSign: "ENG-201",
      type: "FIRE" as const,
      latitude: 18.9766,
      longitude: 72.8328,
      locationLabel: "Byculla fire station",
      status: "AVAILABLE" as const,
      capabilities: { water: true, ladder: false },
    },
    {
      callSign: "ENG-202",
      type: "FIRE" as const,
      latitude: 19.0178,
      longitude: 72.842,
      locationLabel: "Dadar fire station",
      status: "AVAILABLE" as const,
      capabilities: { water: true, ladder: true },
    },
    {
      callSign: "ENG-203",
      type: "FIRE" as const,
      latitude: 19.0596,
      longitude: 72.8295,
      locationLabel: "Bandra West fire station",
      status: "AVAILABLE" as const,
      capabilities: { water: true, ladder: true },
    },
    {
      callSign: "ENG-204",
      type: "FIRE" as const,
      latitude: 19.1197,
      longitude: 72.8468,
      locationLabel: "Andheri fire station",
      status: "AVAILABLE" as const,
      capabilities: { water: true, rescue: true },
    },
    {
      callSign: "ENG-205",
      type: "FIRE" as const,
      latitude: 19.0176,
      longitude: 72.8172,
      locationLabel: "Worli fire station",
      status: "AVAILABLE" as const,
      capabilities: { water: true, foam: true },
    },
    {
      callSign: "POL-301",
      type: "POLICE" as const,
      latitude: 18.9402,
      longitude: 72.8353,
      locationLabel: "CSMT police post",
      status: "AVAILABLE" as const,
      capabilities: { patrol: true },
    },
  ];

  for (const vehicle of vehicles) {
    await prisma.emergencyVehicle.upsert({
      where: { callSign: vehicle.callSign },
      update: {
        type: vehicle.type,
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        locationLabel: vehicle.locationLabel,
        status: vehicle.status,
        capabilities: vehicle.capabilities,
        assignedEmergencyId: null,
      },
      create: vehicle,
    });
  }

  const corridors = [
    {
      corridorId: "SION_LINK",
      title: "DEMO SIMULATION — Sion–Parel link clear",
      status: "CLEAR" as const,
      polyline: sionLink,
      label: "Sion–Parel link (deterministic demo corridor)",
    },
    {
      corridorId: "EASTERN_CONNECTOR",
      title: "DEMO SIMULATION — Eastern connector advisory",
      status: "ADVISORY" as const,
      polyline: eastern,
      label: "Eastern connector",
    },
    {
      corridorId: "KURLA_JUNCTION",
      title: "DEMO SIMULATION — Kurla junction congested",
      status: "CONGESTED" as const,
      polyline: kurlaCongestion,
      label: "Kurla junction",
    },
  ];

  for (const corridor of corridors) {
    const existing = await prisma.roadCondition.findFirst({
      where: { corridorId: corridor.corridorId },
    });
    const geometry = {
      type: "corridor",
      corridorId: corridor.corridorId,
      label: corridor.label,
      polyline: corridor.polyline,
    };
    if (existing) {
      await prisma.roadCondition.update({
        where: { id: existing.id },
        data: {
          title: corridor.title,
          status: corridor.status,
          simulated: true,
          geometry,
        },
      });
    } else {
      await prisma.roadCondition.create({
        data: {
          title: corridor.title,
          status: corridor.status,
          corridorId: corridor.corridorId,
          simulated: true,
          reportedById: admin.id,
          geometry,
        },
      });
    }
  }

  console.log(
    `Seeded RapidRoute demo. Deterministic blockage corridor: ${DETERMINISTIC_DEMO.blockCorridorId}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
