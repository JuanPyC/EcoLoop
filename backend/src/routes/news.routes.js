import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { query } from "../lib/db.js";

const router = Router();

const newsSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  image_url: z.string().nullable().optional(),
  published: z.boolean().optional(),
  author_id: z.string().uuid().nullable().optional(),
});

router.get("/", async (req, res) => {
  const includeAll = req.query.all === "1";

  const result = await query(
    `
      SELECT id, title, content, image_url, author_id, published, created_at, updated_at
      FROM news_articles
      ${includeAll ? "" : "WHERE published = true"}
      ORDER BY created_at DESC
    `,
  );

  return res.status(200).json({ articles: result.rows });
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = newsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const data = parsed.data;
  const result = await query(
    `
      INSERT INTO news_articles (title, content, image_url, author_id, published)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, content, image_url, author_id, published, created_at, updated_at
    `,
    [data.title, data.content, data.image_url ?? null, data.author_id ?? req.user.id, data.published ?? true],
  );

  return res.status(201).json({ article: result.rows[0] });
});

router.delete("/:articleId", requireAuth, requireRole("admin"), async (req, res) => {
  const { articleId } = req.params;
  const result = await query("DELETE FROM news_articles WHERE id = $1 RETURNING id", [articleId]);

  if (!result.rows.length) {
    return res.status(404).json({ error: "Noticia no encontrada" });
  }

  return res.status(200).json({ ok: true });
});

export default router;
