import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../lib/db.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  return res.status(200).json({ profile: req.user });
});

router.get("/leaderboard", async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);

  const result = await query(
    `
      SELECT id, full_name, email, role, eco_points
      FROM users
      ORDER BY eco_points DESC
      LIMIT $1
    `,
    [limit],
  );

  return res.status(200).json({ leaderboard: result.rows });
});

router.get("/me/transactions", requireAuth, async (req, res) => {
  const result = await query(
    `
      SELECT
        t.id,
        t.points_earned,
        t.waste_type,
        t.created_at,
        wb.id AS bin_id,
        wb.qr_code,
        ws.id AS station_id,
        ws.name AS station_name,
        ws.location AS station_location
      FROM transactions t
      JOIN waste_bins wb ON wb.id = t.bin_id
      JOIN waste_stations ws ON ws.id = wb.station_id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `,
    [req.user.id],
  );

  const transactions = result.rows.map((row) => ({
    id: row.id,
    points_earned: row.points_earned,
    waste_type: row.waste_type,
    created_at: row.created_at,
    waste_bins: {
      id: row.bin_id,
      qr_code: row.qr_code,
      waste_stations: {
        id: row.station_id,
        name: row.station_name,
        location: row.station_location,
      },
    },
  }));

  return res.status(200).json({ transactions });
});

export default router;
