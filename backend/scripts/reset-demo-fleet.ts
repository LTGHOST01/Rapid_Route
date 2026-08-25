import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.journey.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "COMPLETED", progress: 1 },
  });
  await prisma.emergency.updateMany({
    where: { status: { in: ["OPEN", "ASSIGNED", "DISPATCHED"] } },
    data: { status: "COMPLETED" },
  });
  await prisma.emergencyVehicle.updateMany({
    where: { type: { in: ["AMBULANCE", "FIRE", "POLICE"] } },
    data: { status: "AVAILABLE", assignedEmergencyId: null },
  });
  const vehicles = await prisma.emergencyVehicle.findMany({
    select: { callSign: true, status: true },
    orderBy: { callSign: "asc" },
  });
  console.log(vehicles);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
