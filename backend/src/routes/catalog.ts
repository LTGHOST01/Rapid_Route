import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { DEMO_CORRIDORS, MUMBAI_HOSPITALS, MUMBAI_ORIGINS } from "../lib/locations";

export const catalogRouter = Router();

catalogRouter.use(requireAuth);

catalogRouter.get("/locations", (_req, res) => {
  res.json({
    origins: MUMBAI_ORIGINS,
    hospitals: MUMBAI_HOSPITALS,
    corridors: DEMO_CORRIDORS,
    deterministicDemo: {
      originId: "dadar",
      hospitalId: "kem",
      blockCorridorId: "SION_LINK",
      label: "DEMO SIMULATION",
    },
  });
});
