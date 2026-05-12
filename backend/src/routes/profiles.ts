import { Router, Request, Response } from "express";
import { listProfiles, getProfileById, updateProfile } from "../infrastructure/repositories/profilesRepository";

export const profilesRouter = Router();

/**
 * @openapi
 * tags:
 *   name: Profiles
 *   description: Gestión de perfiles de usuarios
 */

/**
 * @openapi
 * /api/profiles:
 *   get:
 *     summary: Listar todos los perfiles
 *     tags: [Profiles]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, worker, admin]
 *         description: Filtrar por rol
 *     responses:
 *       200:
 *         description: Lista de perfiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 */
profilesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const role = req.query.role as string | undefined;
    const data = await listProfiles(role ? { role } : undefined);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/profiles/{id}:
 *   get:
 *     summary: Obtener perfil por ID
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: No encontrado
 */
profilesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const data = await getProfileById(req.params.id);
    if (!data) return res.status(404).json({ error: "Perfil no encontrado" });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/profiles/{id}:
 *   put:
 *     summary: Actualizar perfil
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
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
 *         description: Perfil actualizado
 */
profilesRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await updateProfile(id, { ...req.body, updated_at: new Date() });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
