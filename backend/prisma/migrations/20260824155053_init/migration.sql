-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DISPATCHER');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('AMBULANCE', 'FIRE', 'POLICE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EmergencyPriority" AS ENUM ('CRITICAL', 'HIGH', 'STANDARD');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('OPEN', 'ASSIGNED', 'DISPATCHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoadStatus" AS ENUM ('CLEAR', 'ADVISORY', 'CONGESTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RouteProvider" AS ENUM ('GOOGLE', 'DEMO');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('OK', 'FALLBACK', 'ERROR');

-- CreateEnum
CREATE TYPE "TrafficLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SelectedBy" AS ENUM ('ENGINE', 'DISPATCHER');

-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RouteEventType" AS ENUM ('DISPATCHED', 'POSITION', 'CONDITION_CHANGE', 'REROUTE_TRIGGERED', 'ROUTE_RECALCULATED', 'REROUTED', 'REROUTE_DECLINED', 'ARRIVED', 'PAUSED', 'RESUMED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyVehicle" (
    "id" TEXT NOT NULL,
    "callSign" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "capabilities" JSONB NOT NULL,
    "assignedEmergencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emergency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "priority" "EmergencyPriority" NOT NULL,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'OPEN',
    "originLabel" TEXT NOT NULL,
    "originLat" DECIMAL(10,7) NOT NULL,
    "originLng" DECIMAL(10,7) NOT NULL,
    "destinationLabel" TEXT NOT NULL,
    "destinationLat" DECIMAL(10,7) NOT NULL,
    "destinationLng" DECIMAL(10,7) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Emergency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadCondition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "RoadStatus" NOT NULL,
    "geometry" JSONB NOT NULL,
    "corridorId" TEXT NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),
    "reportedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteRequest" (
    "id" TEXT NOT NULL,
    "emergencyId" TEXT NOT NULL,
    "originLabel" TEXT NOT NULL,
    "originLat" DECIMAL(10,7) NOT NULL,
    "originLng" DECIMAL(10,7) NOT NULL,
    "destinationLabel" TEXT NOT NULL,
    "destinationLat" DECIMAL(10,7) NOT NULL,
    "destinationLng" DECIMAL(10,7) NOT NULL,
    "provider" "RouteProvider" NOT NULL,
    "providerStatus" "ProviderStatus" NOT NULL,
    "providerMessage" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteCandidate" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerRouteIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "polyline" TEXT NOT NULL,
    "etaSeconds" INTEGER NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "trafficLevel" "TrafficLevel" NOT NULL,
    "roadImpact" "RoadStatus" NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "score" DECIMAL(6,2),
    "corridorIds" JSONB NOT NULL,
    "breakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteSelection" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "selectedBy" "SelectedBy" NOT NULL,
    "reason" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" TEXT NOT NULL,
    "emergencyId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "selectionId" TEXT NOT NULL,
    "status" "JourneyStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedArrivalAt" TIMESTAMP(3) NOT NULL,
    "lastLat" DECIMAL(10,7) NOT NULL,
    "lastLng" DECIMAL(10,7) NOT NULL,
    "progress" DECIMAL(6,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteEvent" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "type" "RouteEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "RouteEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyVehicle_callSign_key" ON "EmergencyVehicle"("callSign");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyVehicle_assignedEmergencyId_key" ON "EmergencyVehicle"("assignedEmergencyId");

-- CreateIndex
CREATE INDEX "EmergencyVehicle_status_idx" ON "EmergencyVehicle"("status");

-- CreateIndex
CREATE INDEX "EmergencyVehicle_type_status_idx" ON "EmergencyVehicle"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Emergency_code_key" ON "Emergency"("code");

-- CreateIndex
CREATE INDEX "Emergency_status_createdAt_idx" ON "Emergency"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Emergency_priority_status_idx" ON "Emergency"("priority", "status");

-- CreateIndex
CREATE INDEX "RoadCondition_status_activeFrom_idx" ON "RoadCondition"("status", "activeFrom");

-- CreateIndex
CREATE INDEX "RoadCondition_corridorId_idx" ON "RoadCondition"("corridorId");

-- CreateIndex
CREATE INDEX "RouteRequest_emergencyId_requestedAt_idx" ON "RouteRequest"("emergencyId", "requestedAt");

-- CreateIndex
CREATE INDEX "RouteCandidate_requestId_idx" ON "RouteCandidate"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteSelection_requestId_key" ON "RouteSelection"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Journey_emergencyId_key" ON "Journey"("emergencyId");

-- CreateIndex
CREATE INDEX "Journey_status_idx" ON "Journey"("status");

-- CreateIndex
CREATE INDEX "RouteEvent_journeyId_occurredAt_idx" ON "RouteEvent"("journeyId", "occurredAt");

-- AddForeignKey
ALTER TABLE "EmergencyVehicle" ADD CONSTRAINT "EmergencyVehicle_assignedEmergencyId_fkey" FOREIGN KEY ("assignedEmergencyId") REFERENCES "Emergency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emergency" ADD CONSTRAINT "Emergency_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadCondition" ADD CONSTRAINT "RoadCondition_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteRequest" ADD CONSTRAINT "RouteRequest_emergencyId_fkey" FOREIGN KEY ("emergencyId") REFERENCES "Emergency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteCandidate" ADD CONSTRAINT "RouteCandidate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RouteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSelection" ADD CONSTRAINT "RouteSelection_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RouteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSelection" ADD CONSTRAINT "RouteSelection_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RouteCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_emergencyId_fkey" FOREIGN KEY ("emergencyId") REFERENCES "Emergency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "EmergencyVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "RouteSelection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteEvent" ADD CONSTRAINT "RouteEvent_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
