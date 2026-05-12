import { Router, Request, Response } from "express";
import { listNews, getNewsById, createNews, deleteNews } from "../infrastructure/repositories/newsRepository";

export const newsRouter = Router();

/**
 * @openapi
 * tags:
 *   name: News
 *   description: Gestión de artículos de noticias
 */

/**
 * @openapi
 * /api/news:
 *   get:
 *     summary: Listar artículos de noticias
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Filtrar solo publicados
 *     responses:
 *       200:
 *         description: Lista de artículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NewsArticle'
 */
newsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const published = req.query.published === "true";
    const data = await listNews(req.query.published ? { published } : undefined);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/news/{id}:
 *   get:
 *     summary: Obtener un artículo por ID
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Artículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsArticle'
 *       404:
 *         description: No encontrado
 */
newsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const data = await getNewsById(req.params.id);
    if (!data) return res.status(404).json({ error: "Artículo no encontrado" });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/news:
 *   post:
 *     summary: Crear artículo
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image_url:
 *                 type: string
 *               published:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Artículo creado
 */
newsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { title, content, image_url, published } = req.body;
    if (!title || !content) return res.status(400).json({ error: "title y content son requeridos" });
    const data = await createNews({ title, content, image_url, published: published || false });
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/news/{id}:
 *   delete:
 *     summary: Eliminar artículo
 *     tags: [News]
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
 *         description: Eliminado
 */
newsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    await deleteNews(req.params.id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
