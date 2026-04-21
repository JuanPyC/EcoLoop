import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

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
  let query = supabase.from("news_articles").select("*");
  if (req.query.published === "true") query = query.eq("published", true);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
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
  const { data, error } = await supabase
    .from("news_articles")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: "Artículo no encontrado" });
  return res.json(data);
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
  const { title, content, image_url, published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "title y content son requeridos" });
  }
  const { data, error } = await supabase
    .from("news_articles")
    .insert({ title, content, image_url, published: published || false })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
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
  const { error } = await supabase.from("news_articles").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});
