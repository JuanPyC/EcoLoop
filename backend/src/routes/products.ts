import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

export const productsRouter = Router();

/**
 * @openapi
 * tags:
 *   name: Products
 *   description: Gestión de productos de la tienda de EcoPoints
 */

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Listar todos los productos
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filtrar solo productos disponibles
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productsRouter.get("/", async (req: Request, res: Response) => {
  let query = supabase.from("products").select("*");
  if (req.query.available === "true") query = query.eq("is_available", true);
  if (req.query.category) query = query.eq("category", req.query.category as string);
  const { data, error } = await query.order("name");
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Datos del producto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 */
productsRouter.get("/:id", async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: "Producto no encontrado" });
  return res.json(data);
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, points_cost, category]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               points_cost:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
productsRouter.post("/", async (req: Request, res: Response) => {
  const { name, description, points_cost, stock, category, image_url } = req.body;
  if (!name || !points_cost || !category) {
    return res.status(400).json({ error: "name, points_cost y category son requeridos" });
  }
  const { data, error } = await supabase
    .from("products")
    .insert({ name, description, points_cost, stock: stock || 0, category, image_url })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Producto actualizado
 */
productsRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, points_cost, stock, category, is_available, image_url } = req.body;
  const { data, error } = await supabase
    .from("products")
    .update({ name, description, points_cost, stock, category, is_available, image_url, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Products]
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
 *         description: Eliminado exitosamente
 */
productsRouter.delete("/:id", async (req: Request, res: Response) => {
  const { error } = await supabase.from("products").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});
