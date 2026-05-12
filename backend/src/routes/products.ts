import { Router, Request, Response } from "express";
import { listProducts, getProductById, createProduct, updateProduct, deleteProduct } from "../infrastructure/repositories/productsRepository";

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
  try {
    const available = req.query.available === "true";
    const category = req.query.category as string | undefined;
    const data = await listProducts({ available: req.query.available ? available : undefined, category });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
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
  try {
    const data = await getProductById(req.params.id);
    if (!data) return res.status(404).json({ error: "Producto no encontrado" });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
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
  try {
    const { name, description, points_cost, stock, category, image_url } = req.body;
    if (!name || !points_cost || !category) {
      return res.status(400).json({ error: "name, points_cost y category son requeridos" });
    }
    const data = await createProduct({ name, description, points_cost, stock: stock || 0, category, image_url });
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
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
  try {
    const { id } = req.params;
    const data = await updateProduct(id, { ...req.body, updated_at: new Date() });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
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
  try {
    await deleteProduct(req.params.id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
