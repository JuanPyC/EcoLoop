import { query } from "../lib/db.js";
import { verifyAccessToken } from "../lib/auth-token.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticacion requerido" });
  }

  const token = authHeader.slice(7).trim();

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({ error: "Token invalido o expirado" });
  }

  const result = await query("SELECT id, email, full_name, role, eco_points FROM users WHERE id = $1", [payload.sub]);

  if (!result.rows.length) {
    return res.status(403).json({ error: "Perfil no encontrado" });
  }

  const user = result.rows[0];

  req.user = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    ecoPoints: user.eco_points,
    token,
  };

  return next();
}
