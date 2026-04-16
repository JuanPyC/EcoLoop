import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { withTransaction } from "../lib/db.js";
import { MAX_BIN_CAPACITY_KG, POINTS_BY_TYPE, POINTS_PER_KG } from "../constants/points.js";

const router = Router();

const depositSchema = z.object({
  qrCode: z.string().min(2),
  amount: z.number().positive(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = depositSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { qrCode, amount } = parsed.data;

  try {
    const result = await withTransaction(async (client) => {
      const binQuery = await client.query(
        `
          SELECT
            wb.id,
            wb.waste_type,
            wb.current_weight,
            ws.name AS station_name,
            ws.location AS station_location
          FROM waste_bins wb
          JOIN waste_stations ws ON ws.id = wb.station_id
          WHERE wb.qr_code = $1
          FOR UPDATE
        `,
        [qrCode],
      );

      if (!binQuery.rows.length) {
        return { errorCode: 404, errorMessage: "Codigo QR no valido" };
      }

      const bin = binQuery.rows[0];
      const currentWeight = Number(bin.current_weight ?? 0);

      if (currentWeight >= MAX_BIN_CAPACITY_KG) {
        return { errorCode: 409, errorMessage: "Esta canasta esta llena" };
      }

      const remaining = MAX_BIN_CAPACITY_KG - currentWeight;
      const deposited = Math.min(amount, remaining);
      const newWeight = Number((currentWeight + deposited).toFixed(2));
      const newCapacity = Math.round((newWeight / MAX_BIN_CAPACITY_KG) * 100);

      const wasteType = bin.waste_type;
      const basePoints = POINTS_BY_TYPE[wasteType] ?? 0;
      const pointsPerKg = POINTS_PER_KG[wasteType] ?? 0;
      const pointsEarned = Math.round(basePoints + deposited * pointsPerKg);

      await client.query(
        `
          INSERT INTO transactions (user_id, bin_id, points_earned, waste_type)
          VALUES ($1, $2, $3, $4)
        `,
        [req.user.id, bin.id, pointsEarned, wasteType],
      );

      await client.query(
        `
          UPDATE waste_bins
          SET current_weight = $1,
              capacity_percentage = $2,
              needs_attention = $3,
              updated_at = now()
          WHERE id = $4
        `,
        [newWeight, newCapacity, newCapacity >= 80, bin.id],
      );

      await client.query("UPDATE users SET eco_points = eco_points + $1, updated_at = now() WHERE id = $2", [
        pointsEarned,
        req.user.id,
      ]);

      return {
        depositedKg: deposited,
        pointsEarned,
        newWeight,
        newCapacity,
        stationName: bin.station_name,
        stationLocation: bin.station_location,
      };
    });

    if (result.errorCode) {
      return res.status(result.errorCode).json({ error: result.errorMessage });
    }

    return res.status(201).json({
      message: "Deposito registrado exitosamente",
      result,
    });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo registrar el deposito" });
  }
});

export default router;
