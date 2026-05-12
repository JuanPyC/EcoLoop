import { Router, Request, Response } from "express";
import { createProfile, findProfileByEmail } from "../infrastructure/repositories/profilesRepository";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  authMiddleware,
  JWTPayload,
} from "../infrastructure/auth";

export const authRouter = Router();

const sanitizeProfile = (profile: any) => ({
  id: profile.id,
  email: profile.email,
  full_name: profile.full_name,
  role: profile.role,
  eco_points: profile.eco_points,
});

/**
 * POST /auth/login
 * Login con email y contraseña
 * Retorna JWT token
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email y password son requeridos",
      });
    }

    const profile = await findProfileByEmail(email);
    if (!profile) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, profile.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar JWT token
    const token = generateToken({
      userId: profile.id,
      email: profile.email,
      role: profile.role,
    });

    return res.json({
      token,
      user: sanitizeProfile(profile),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/register
 * Registrar nuevo usuario con email y contraseña
 * Retorna JWT token
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email y password son requeridos",
      });
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 6 caracteres",
      });
    }

    // Verificar que el email no exista
    const existing = await findProfileByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: "El email ya está registrado",
      });
    }

    // Hash de contraseña
    const password_hash = await hashPassword(password);

    // Crear usuario
    const profile = await createProfile({
      email,
      password_hash,
      full_name: full_name || email.split("@")[0],
      role: "user",
    });

    // Generar JWT token
    const token = generateToken({
      userId: profile.id,
      email: profile.email,
      role: profile.role,
    });

    return res.status(201).json({
      token,
      user: sanitizeProfile(profile),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /auth/me
 * Obtener usuario autenticado (requiere JWT token)
 */
authRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const profile = await findProfileByEmail(req.user.email);
    if (!profile) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ user: sanitizeProfile(profile) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/logout
 * Logout (simplemente retorna confirmación, el token debe ser invalidado en frontend)
 */
authRouter.post("/logout", authMiddleware, (req: Request, res: Response) => {
  return res.json({ message: "Logout exitoso" });
});
