import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { query } from "../lib/db.js";

const router = Router();

const stationSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  description: z.string().nullable().optional(),
});

const binSchema = z.object({
  station_id: z.string().uuid(),
  waste_type: z.enum(["recyclable", "organic", "non_recyclable"]),
  capacity_percentage: z.number().int().min(0).max(100).optional(),
  current_weight: z.number().min(0).optional(),
  qr_code: z.string().min(3),
});

const updateBinSchema = z.object({
  capacity_percentage: z.number().int().min(0).max(100).optional(),
  current_weight: z.number().min(0).optional(),
  needs_attention: z.boolean().optional(),
});

/**
 * @swagger
 * /stations:
 *   get:
 *     summary: List all waste stations and their bins
 *     tags: [Stations]
 *     responses:
 *       200:
 *         description: List of stations
 */
router.get("/", async (req, res) => {
  const result = await query(
    `
      SELECT
        ws.id AS station_id,
        ws.name AS station_name,
        ws.location,
        ws.description,
        ws.created_at AS station_created_at,
        ws.updated_at AS station_updated_at,
        wb.id AS bin_id,
        wb.waste_type,
        wb.capacity_percentage,
        wb.current_weight,
        wb.needs_attention,
        wb.qr_code
      FROM waste_stations ws
      LEFT JOIN waste_bins wb ON wb.station_id = ws.id
      ORDER BY ws.created_at DESC
    `,
  );

  const stationsMap = new Map();

  for (const row of result.rows) {
    if (!stationsMap.has(row.station_id)) {
      stationsMap.set(row.station_id, {
        id: row.station_id,
        name: row.station_name,
        location: row.location,
        description: row.description,
        created_at: row.station_created_at,
        updated_at: row.station_updated_at,
        waste_bins: [],
      });
    }

    if (row.bin_id) {
      stationsMap.get(row.station_id).waste_bins.push({
        id: row.bin_id,
        waste_type: row.waste_type,
        capacity_percentage: row.capacity_percentage,
        current_weight: row.current_weight,
        needs_attention: row.needs_attention,
        qr_code: row.qr_code,
      });
    }
  }

  return res.status(200).json({ stations: Array.from(stationsMap.values()) });
});

/**
 * @swagger
 * /stations/bins/qr/{qrCode}:
 *   get:
 *     summary: Get bin details by QR code
 *     tags: [Stations]
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bin details
 *       404:
 *         description: Bin not found
 */
router.get("/bins/qr/:qrCode", async (req, res) => {
  const { qrCode } = req.params;

  const result = await query(
    `
      SELECT
        wb.id,
        wb.station_id,
        wb.waste_type,
        wb.capacity_percentage,
        wb.current_weight,
        wb.needs_attention,
        wb.qr_code,
        ws.name AS station_name,
        ws.location AS station_location
      FROM waste_bins wb
      JOIN waste_stations ws ON ws.id = wb.station_id
      WHERE wb.qr_code = $1
      LIMIT 1
    `,
    [qrCode],
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Canasta no encontrada para ese QR" });
  }

  const row = result.rows[0];

  const bin = {
    id: row.id,
    station_id: row.station_id,
    waste_type: row.waste_type,
    capacity_percentage: row.capacity_percentage,
    current_weight: row.current_weight,
    needs_attention: row.needs_attention,
    qr_code: row.qr_code,
    waste_stations: {
      name: row.station_name,
      location: row.station_location,
    },
  };

  return res.status(200).json({ bin });
});

/**
 * @swagger
 * /stations:
 *   post:
 *     summary: Create a waste station (admin only)
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Station created
 *       401:
 *         description: Unauthorized
 */
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = stationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { name, location, description } = parsed.data;
  const result = await query(
    `
      INSERT INTO waste_stations (name, location, description)
      VALUES ($1, $2, $3)
      RETURNING id, name, location, description, created_at, updated_at
    `,
    [name, location, description ?? null],
  );

  return res.status(201).json({ station: result.rows[0] });
});

router.post("/bins", requireAuth, requireRole("admin"), async (req, res) => {
  const payload = Array.isArray(req.body) ? req.body : [req.body];
  const parsed = z.array(binSchema).safeParse(payload);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const created = [];
  for (const bin of parsed.data) {
    const result = await query(
      `
        INSERT INTO waste_bins (station_id, waste_type, capacity_percentage, current_weight, qr_code)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, station_id, waste_type, capacity_percentage, current_weight, needs_attention, qr_code
      `,
      [bin.station_id, bin.waste_type, bin.capacity_percentage ?? 0, bin.current_weight ?? 0, bin.qr_code],
    );
    created.push(result.rows[0]);
  }

  return res.status(201).json({ bins: created });
});

router.patch("/:stationId", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = stationSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { stationId } = req.params;
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of ["name", "location", "description"]) {
    if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(parsed.data[key]);
    }
  }

  if (!fields.length) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  values.push(stationId);

  const result = await query(
    `
      UPDATE waste_stations
      SET ${fields.join(", ")}, updated_at = now()
      WHERE id = $${idx}
      RETURNING id, name, location, description, created_at, updated_at
    `,
    values,
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Estacion no encontrada" });
  }

  return res.status(200).json({ station: result.rows[0] });
});

router.delete("/:stationId", requireAuth, requireRole("admin"), async (req, res) => {
  const { stationId } = req.params;
  const result = await query("DELETE FROM waste_stations WHERE id = $1 RETURNING id", [stationId]);

  if (!result.rows.length) {
    return res.status(404).json({ error: "Estacion no encontrada" });
  }

  return res.status(200).json({ ok: true });
});

router.patch("/bins/:binId", requireAuth, async (req, res) => {
  const parsed = updateBinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { binId } = req.params;
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of ["capacity_percentage", "current_weight", "needs_attention"]) {
    if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(parsed.data[key]);
    }
  }

  if (!fields.length) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  values.push(binId);

  const result = await query(
    `
      UPDATE waste_bins
      SET ${fields.join(", ")}, updated_at = now()
      WHERE id = $${idx}
      RETURNING id, station_id, waste_type, capacity_percentage, current_weight, needs_attention, qr_code
    `,
    values,
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Canasta no encontrada" });
  }

  return res.status(200).json({ bin: result.rows[0] });
});

export default router;
