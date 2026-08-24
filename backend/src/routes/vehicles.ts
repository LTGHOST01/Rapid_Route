import { Router } from "express";
import type { VehicleStatus, VehicleType } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { createVehicleSchema, patchVehicleSchema } from "../validators";
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicles,
  updateVehicle,
} from "../services/vehicleService";
import { paramId } from "../lib/params";

export const vehiclesRouter = Router();

vehiclesRouter.use(requireAuth);

vehiclesRouter.get("/", async (req, res) => {
  const status = req.query.status as VehicleStatus | undefined;
  const type = req.query.type as VehicleType | undefined;
  res.json({ vehicles: await listVehicles({ status, type }) });
});

vehiclesRouter.get("/:id", async (req, res) => {
  res.json({ vehicle: await getVehicle(paramId(req.params.id)) });
});

vehiclesRouter.post("/", requireRole("ADMIN"), async (req, res) => {
  const body = createVehicleSchema.parse(req.body);
  const vehicle = await createVehicle(body);
  res.status(201).json({ vehicle });
});

vehiclesRouter.patch("/:id", requireRole("ADMIN"), async (req, res) => {
  const body = patchVehicleSchema.parse(req.body);
  const vehicle = await updateVehicle(paramId(req.params.id), body);
  res.json({ vehicle });
});

vehiclesRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  await deleteVehicle(paramId(req.params.id));
  res.status(204).send();
});
