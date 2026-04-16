import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { query, withTransaction } from "../lib/db.js";

const router = Router();

const redemptionSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20).default(1),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = redemptionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { productId, quantity } = parsed.data;

  try {
    const redemption = await withTransaction(async (client) => {
      const userResult = await client.query("SELECT id, eco_points FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
      if (!userResult.rows.length) {
        return { errorCode: 404, errorMessage: "Perfil no encontrado" };
      }

      const productResult = await client.query(
        "SELECT id, name, points_cost, stock, is_available FROM products WHERE id = $1 FOR UPDATE",
        [productId],
      );
      if (!productResult.rows.length) {
        return { errorCode: 404, errorMessage: "Producto no encontrado" };
      }

      const user = userResult.rows[0];
      const product = productResult.rows[0];

      if (!product.is_available) {
        return { errorCode: 409, errorMessage: "Producto no disponible" };
      }

      if (product.stock < quantity) {
        return { errorCode: 409, errorMessage: "Stock insuficiente" };
      }

      const pointsSpent = product.points_cost * quantity;
      if (user.eco_points < pointsSpent) {
        return {
          errorCode: 409,
          errorMessage: "EcoPoints insuficientes",
          errorPayload: {
            required: pointsSpent,
            current: user.eco_points,
          },
        };
      }

      const insertResult = await client.query(
        `
          INSERT INTO redemptions (user_id, product_id, points_spent, quantity, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, user_id, product_id, quantity, points_spent, status, created_at
        `,
        [req.user.id, productId, pointsSpent, quantity, "pending"],
      );

      await client.query("UPDATE users SET eco_points = eco_points - $1, updated_at = now() WHERE id = $2", [
        pointsSpent,
        req.user.id,
      ]);

      await client.query("UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2", [quantity, productId]);

      return insertResult.rows[0];
    });

    if (redemption.errorCode) {
      return res
        .status(redemption.errorCode)
        .json(redemption.errorPayload ? { error: redemption.errorMessage, ...redemption.errorPayload } : { error: redemption.errorMessage });
    }

    return res.status(201).json({
      message: "Canje registrado exitosamente",
      redemption,
    });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo registrar el canje" });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  const result = await query(
    `
      SELECT
        r.id,
        r.quantity,
        r.points_spent,
        r.status,
        r.created_at,
        p.name,
        p.category,
        p.image_url
      FROM redemptions r
      JOIN products p ON p.id = r.product_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `,
    [req.user.id],
  );

  const redemptions = result.rows.map((row) => ({
    id: row.id,
    quantity: row.quantity,
    points_spent: row.points_spent,
    status: row.status,
    created_at: row.created_at,
    products: {
      name: row.name,
      category: row.category,
      image_url: row.image_url,
    },
  }));

  return res.status(200).json({ redemptions });
});

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500);

  const result = await query(
    `
      SELECT
        r.id,
        r.quantity,
        r.points_spent,
        r.status,
        r.created_at,
        u.full_name,
        u.email,
        p.name AS product_name
      FROM redemptions r
      JOIN users u ON u.id = r.user_id
      JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC
      LIMIT $1
    `,
    [limit],
  );

  const redemptions = result.rows.map((row) => ({
    id: row.id,
    quantity: row.quantity,
    points_spent: row.points_spent,
    status: row.status,
    created_at: row.created_at,
    profiles: {
      full_name: row.full_name,
      email: row.email,
    },
    products: {
      name: row.product_name,
    },
  }));

  return res.status(200).json({ redemptions });
});

export default router;
