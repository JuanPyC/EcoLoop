import { Router } from "express";
import { query } from "../lib/db.js";

const router = Router();

router.get("/", async (req, res) => {
  const result = await query(
    `
      SELECT id, name, description, points_cost, image_url, stock, category, is_available, created_at, updated_at
      FROM products
      WHERE is_available = true
      ORDER BY created_at DESC
    `,
  );

  return res.status(200).json({ products: result.rows });
});

export default router;
