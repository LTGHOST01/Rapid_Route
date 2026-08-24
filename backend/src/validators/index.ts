import { z } from "zod";

const lat = z.number().gte(-90).lte(90);
const lng = z.number().gte(-180).lte(180);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createEmergencySchema = z.object({
  priority: z.enum(["CRITICAL", "HIGH", "STANDARD"]),
  originLabel: z.string().min(2).max(160),
  originLat: lat,
  originLng: lng,
  destinationLabel: z.string().min(2).max(160),
  destinationLat: lat,
  destinationLng: lng,
  notes: z.string().max(1000).optional().default(""),
});

export const assignVehicleSchema = z.object({
  vehicleId: z.string().uuid().optional(),
});

export const calculateRoutesSchema = z.object({
  forceDemo: z.boolean().optional().default(false),
});

export const dispatchSchema = z.object({
  candidateId: z.string().uuid().optional(),
});

export const createVehicleSchema = z.object({
  callSign: z.string().min(2).max(32),
  type: z.enum(["AMBULANCE", "FIRE", "POLICE"]),
  latitude: lat,
  longitude: lng,
  locationLabel: z.string().min(2).max(160),
  status: z.enum(["AVAILABLE", "ASSIGNED", "INACTIVE"]).optional(),
  capabilities: z.record(z.string(), z.unknown()).optional(),
});

export const patchVehicleSchema = createVehicleSchema.partial();

const geometrySchema = z.object({
  type: z.string().optional(),
  corridorId: z.string().optional(),
  label: z.string().optional(),
  polyline: z.string().optional(),
  points: z
    .array(z.object({ lat, lng }))
    .optional(),
});

export const createRoadConditionSchema = z.object({
  title: z.string().min(2).max(160),
  status: z.enum(["CLEAR", "ADVISORY", "CONGESTED", "BLOCKED"]),
  corridorId: z.string().min(2).max(64),
  geometry: geometrySchema.optional(),
  simulated: z.boolean().optional().default(true),
  activeUntil: z.string().datetime().nullable().optional(),
});

export const patchRoadConditionSchema = createRoadConditionSchema.partial();

export const tickSchema = z.object({
  steps: z.number().int().min(1).max(20).optional().default(1),
});

export const rerouteSchema = z.object({
  force: z.boolean().optional().default(false),
  forceDemo: z.boolean().optional().default(false),
});

export const demoScenarioSchema = z.object({
  status: z.enum(["CLEAR", "CONGESTED", "BLOCKED"]),
  corridorId: z.string().min(2).max(64).optional(),
  journeyId: z.string().uuid().optional(),
});

export const selectCandidateSchema = z.object({
  candidateId: z.string().uuid(),
});
