import { Router, Request, Response } from "express";
import { listStations, getStationById, createStation, updateStation, deleteStation } from "../infrastructure/repositories/stationsRepository";

export const stationsRouter = Router();

/**
 * @openapi
 * tags:
 *   name: Stations
 *   description: Gestión de estaciones de reciclaje
 */

/**
 * @openapi
 * /api/stations:
 *   get:
 *     summary: Listar todas las estaciones
 *     tags: [Stations]
 *     responses:
 *       200:
 *         description: Lista de estaciones de reciclaje
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WasteStation'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
stationsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await listStations();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/stations/{id}:
 *   get:
 *     summary: Obtener una estación por ID
 *     tags: [Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de la estación
 *     responses:
 *       200:
 *         description: Datos de la estación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WasteStation'
 *       404:
 *         description: Estación no encontrada
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
stationsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const data = await getStationById(req.params.id);
    if (!data) return res.status(404).json({ error: "Estación no encontrada" });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/stations:
 *   post:
 *     summary: Crear una nueva estación
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Estación Norte"
 *               location:
 *                 type: string
 *                 example: "Bloque C - Piso 1"
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Estación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WasteStation'
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
stationsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { name, location, description } = req.body;
    if (!name || !location) return res.status(400).json({ error: "name y location son requeridos" });
    const data = await createStation({ name, location, description });
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/stations/{id}:
 *   put:
 *     summary: Actualizar una estación
 *     tags: [Stations]
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
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estación actualizada
 *       404:
 *         description: No encontrada
 */
stationsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await updateStation(id, { ...req.body, updated_at: new Date() });
    return res.json(data);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/stations/{id}:
 *   delete:
 *     summary: Eliminar una estación
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Eliminada exitosamente
 *       404:
 *         description: No encontrada
 */
stationsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteStation(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});
