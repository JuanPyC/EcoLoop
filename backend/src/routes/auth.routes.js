import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../lib/db.js";
import { signAccessToken } from "../lib/auth-token.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).max(120),
  role: z.enum(["user", "worker", "admin"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { email, password, fullName } = parsed.data;
  const role = parsed.data.role ?? "user";

  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length) {
    return res.status(409).json({ error: "El correo ya esta registrado" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const created = await query(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, role, eco_points
    `,
    [email, passwordHash, fullName, role],
  );

  const user = created.rows[0];
  const accessToken = signAccessToken(user);

  return res.status(201).json({
    message: "Usuario registrado correctamente.",
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      ecoPoints: user.eco_points,
    },
  });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const result = await query(
    "SELECT id, email, full_name, role, eco_points, password_hash FROM users WHERE email = $1",
    [email],
  );

  if (!result.rows.length) {
    return res.status(401).json({ error: "Credenciales invalidas" });
  }

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    return res.status(401).json({ error: "Credenciales invalidas" });
  }

  const accessToken = signAccessToken(user);

  return res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      ecoPoints: user.eco_points,
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  return res.status(200).json({ user: req.user });
});

export default router;
