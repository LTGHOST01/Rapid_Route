-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('MEDICAL', 'TRAUMA', 'FIRE', 'POLICE');

-- AlterTable
ALTER TABLE "Emergency" ADD COLUMN     "incidentType" "IncidentType" NOT NULL DEFAULT 'MEDICAL';
