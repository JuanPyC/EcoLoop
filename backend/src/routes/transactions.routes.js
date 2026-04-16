import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { query } from "../lib/db.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 500), 2000);

  const result = await query(
    `
      SELECT
        t.id,
        t.user_id,
        t.bin_id,
        t.points_earned,
        t.waste_type,
        t.created_at,
        ws.name AS station_name,
        ws.location AS station_location
      FROM transactions t
      JOIN waste_bins wb ON wb.id = t.bin_id
      JOIN waste_stations ws ON ws.id = wb.station_id
      ORDER BY t.created_at DESC
      LIMIT $1
    `,
    [limit],
  );

  const transactions = result.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    bin_id: row.bin_id,
    points_earned: row.points_earned,
    waste_type: row.waste_type,
    created_at: row.created_at,
    waste_bins: {
      waste_stations: {
        name: row.station_name,
        location: row.station_location,
      },
    },
  }));

  return res.status(200).json({ transactions });
});

export default router;
