import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { query } from "../lib/db.js";

const router = Router();

const updateUserSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  role: z.enum(["user", "worker", "admin"]).optional(),
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await query(
    `
      SELECT id, email, full_name, role, eco_points, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `,
  );

  return res.status(200).json({ users: result.rows });
});

/**
 * @swagger
 * /users/{userId}:
 *   patch:
 *     summary: Update a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, worker, admin]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid data or empty payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch("/:userId", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { userId } = req.params;
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of ["full_name", "role"]) {
    if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(parsed.data[key]);
    }
  }

  if (!fields.length) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  values.push(userId);

  const result = await query(
    `
      UPDATE users
      SET ${fields.join(", ")}, updated_at = now()
      WHERE id = $${idx}
      RETURNING id, email, full_name, role, eco_points, created_at, updated_at
    `,
    values,
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  return res.status(200).json({ user: result.rows[0] });
});

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete yourself
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete("/:userId", requireAuth, requireRole("admin"), async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
  }

  const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [userId]);

  if (!result.rows.length) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  return res.status(200).json({ ok: true });
});

export default router;
