import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { query } from "../lib/db.js";

const router = Router();

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  points_cost: z.number().int().positive(),
  image_url: z.string().nullable().optional(),
  stock: z.number().int().min(0),
  category: z.string().min(1),
  is_available: z.boolean().optional(),
});

router.get("/", async (req, res) => {
  const includeAll = req.query.all === "1";

  const result = await query(
    `
      SELECT id, name, description, points_cost, image_url, stock, category, is_available, created_at, updated_at
      FROM products
      ${includeAll ? "" : "WHERE is_available = true"}
      ORDER BY created_at DESC
    `,
  );

  return res.status(200).json({ products: result.rows });
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const data = parsed.data;

  const result = await query(
    `
      INSERT INTO products (name, description, points_cost, image_url, stock, category, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, description, points_cost, image_url, stock, category, is_available, created_at, updated_at
    `,
    [
      data.name,
      data.description ?? null,
      data.points_cost,
      data.image_url ?? null,
      data.stock,
      data.category,
      data.is_available ?? true,
    ],
  );

  return res.status(201).json({ product: result.rows[0] });
});

router.patch("/:productId", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { productId } = req.params;
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of ["name", "description", "points_cost", "image_url", "stock", "category", "is_available"]) {
    if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(parsed.data[key]);
    }
  }

  if (!fields.length) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  values.push(productId);

  const result = await query(
    `
      UPDATE products
      SET ${fields.join(", ")}, updated_at = now()
      WHERE id = $${idx}
      RETURNING id, name, description, points_cost, image_url, stock, category, is_available, created_at, updated_at
    `,
    values,
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  return res.status(200).json({ product: result.rows[0] });
});

router.delete("/:productId", requireAuth, requireRole("admin"), async (req, res) => {
  const { productId } = req.params;

  const result = await query("DELETE FROM products WHERE id = $1 RETURNING id", [productId]);

  if (!result.rows.length) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  return res.status(200).json({ ok: true });
});

export default router;
