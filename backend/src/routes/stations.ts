import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

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
  const { data, error } = await supabase
    .from("waste_stations")
    .select("*, waste_bins(*)");
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
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
  const { id } = req.params;
  const { data, error } = await supabase
    .from("waste_stations")
    .select("*, waste_bins(*)")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Estación no encontrada" });
  return res.json(data);
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
  const { name, location, description } = req.body;
  if (!name || !location) {
    return res.status(400).json({ error: "name y location son requeridos" });
  }
  const { data, error } = await supabase
    .from("waste_stations")
    .insert({ name, location, description })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
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
  const { id } = req.params;
  const { name, location, description } = req.body;
  const { data, error } = await supabase
    .from("waste_stations")
    .update({ name, location, description, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
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
  const { id } = req.params;
  const { error } = await supabase.from("waste_stations").delete().eq("id", id);
  if (error) return res.status(404).json({ error: error.message });
  return res.status(204).send();
});
