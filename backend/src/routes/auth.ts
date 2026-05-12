import { Router, Request, Response } from "express";
import { createProfile, findProfileByEmail } from "../infrastructure/repositories/profilesRepository";

export const authRouter = Router();

const sanitizeProfile = (profile: any) => ({
  id: profile.id,
  email: profile.email,
  full_name: profile.full_name,
  role: profile.role,
  eco_points: profile.eco_points,
});

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email es requerido" });

    const profile = await findProfileByEmail(email);
    if (!profile) return res.status(401).json({ error: "Usuario no encontrado" });

    return res.json({ user: sanitizeProfile(profile) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, full_name, role } = req.body;
    if (!email) return res.status(400).json({ error: "email es requerido" });

    const existing = await findProfileByEmail(email);
    const profile = existing ?? await createProfile({ email, full_name, role: role ?? "user" });

    return res.status(existing ? 200 : 201).json({ user: sanitizeProfile(profile) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string | undefined;
    if (!email) return res.status(401).json({ error: "No autenticado" });

    const profile = await findProfileByEmail(email);
    if (!profile) return res.status(401).json({ error: "No autenticado" });

    return res.json({ user: sanitizeProfile(profile) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
