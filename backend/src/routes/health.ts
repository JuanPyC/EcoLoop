import { Router } from "express";
import { supabase } from "../supabaseClient";

export const healthRouter = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check del API
 *     description: Verifica que el backend y la conexión a la base de datos estén operativos
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema operativo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
healthRouter.get("/", async (_req, res) => {
  let dbStatus = "disconnected";
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (!error) dbStatus = "connected";
  } catch {
    dbStatus = "disconnected";
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: "1.0.0",
    service: "EcoLoop Backend API",
  });
});
