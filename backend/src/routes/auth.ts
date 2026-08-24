import { Router } from "express";
import { loginSchema, registerSchema } from "../validators";
import { getUserById, login, register } from "../services/authService";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await login(body.email, body.password);
  res.json(result);
});

authRouter.post("/register", async (req, res) => {
  const body = registerSchema.parse(req.body);
  const result = await register(body);
  res.status(201).json(result);
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await getUserById(req.user!.id);
  res.json({ user });
});
