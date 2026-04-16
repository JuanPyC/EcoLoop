import { Router } from "express";
import { query } from "../lib/db.js";

const router = Router();

router.get("/", async (req, res) => {
  const result = await query(
    `
      SELECT id, title, content, image_url, author_id, published, created_at, updated_at
      FROM news_articles
      WHERE published = true
      ORDER BY created_at DESC
    `,
  );

  return res.status(200).json({ articles: result.rows });
});

export default router;
