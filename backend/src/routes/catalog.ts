import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  DEMO_CORRIDORS,
  FIRE_DEMO,
  MUMBAI_FIRE_SCENES,
  MUMBAI_HOSPITALS,
  MUMBAI_ORIGINS,
} from "../lib/locations";

export const catalogRouter = Router();

catalogRouter.use(requireAuth);

catalogRouter.get("/locations", (_req, res) => {
  res.json({
    origins: MUMBAI_ORIGINS,
    hospitals: MUMBAI_HOSPITALS,
    fireScenes: MUMBAI_FIRE_SCENES,
    corridors: DEMO_CORRIDORS,
    deterministicDemo: {
      originId: "dadar",
      hospitalId: "kem",
      blockCorridorId: "SION_LINK",
      label: "DEMO SIMULATION",
    },
    fireDemo: {
      sceneId: FIRE_DEMO.origin.id,
      label: "DEMO SIMULATION",
    },
  });
});
