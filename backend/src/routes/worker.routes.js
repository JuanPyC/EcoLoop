import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { query } from "../lib/db.js";

const router = Router();

const emptyBinSchema = z.object({
  resetToKg: z.number().min(0).max(120).optional(),
});

router.get("/bins/attention", requireAuth, requireRole("worker", "admin"), async (req, res) => {
  const result = await query(
    `
      SELECT
        wb.id,
        wb.waste_type,
        wb.capacity_percentage,
        wb.current_weight,
        wb.needs_attention,
        wb.qr_code,
        ws.id AS station_id,
        ws.name AS station_name,
        ws.location AS station_location
      FROM waste_bins wb
      JOIN waste_stations ws ON ws.id = wb.station_id
      WHERE wb.needs_attention = true
      ORDER BY wb.capacity_percentage DESC
    `,
  );

  const bins = result.rows.map((row) => ({
    id: row.id,
    waste_type: row.waste_type,
    capacity_percentage: row.capacity_percentage,
    current_weight: row.current_weight,
    needs_attention: row.needs_attention,
    qr_code: row.qr_code,
    waste_stations: {
      id: row.station_id,
      name: row.station_name,
      location: row.station_location,
    },
  }));

  return res.status(200).json({ bins });
});

router.patch("/bins/:binId/empty", requireAuth, requireRole("worker", "admin"), async (req, res) => {
  const { binId } = req.params;
  const parsed = emptyBinSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const resetToKg = parsed.data.resetToKg ?? 0;
  const newCapacity = Math.round((resetToKg / 120) * 100);

  const result = await query(
    `
      UPDATE waste_bins
      SET current_weight = $1,
          capacity_percentage = $2,
          needs_attention = $3,
          updated_at = now()
      WHERE id = $4
      RETURNING id, current_weight, capacity_percentage, needs_attention
    `,
    [resetToKg, newCapacity, newCapacity >= 80, binId],
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Canasta no encontrada" });
  }

  return res.status(200).json({ bin: result.rows[0] });
});

export default router;
