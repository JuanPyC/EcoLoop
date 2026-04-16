import { Router } from "express";
import { query } from "../lib/db.js";

const router = Router();

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

export default router;
