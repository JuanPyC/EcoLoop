import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { query, withTransaction } from "../lib/db.js";

const router = Router();

const completionSchema = z.object({
  quizId: z.string().uuid(),
  score: z.number().int().min(0),
  pointsEarned: z.number().int().min(0),
});

router.get("/", async (req, res) => {
  const result = await query(
    `
      SELECT id, title, description, points_reward, is_active, created_at
      FROM quizzes
      WHERE is_active = true
      ORDER BY created_at DESC
    `,
  );

  return res.status(200).json({ quizzes: result.rows });
});

router.get("/:quizId/questions", async (req, res) => {
  const { quizId } = req.params;

  const result = await query(
    `
      SELECT id, quiz_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, order_index
      FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY order_index ASC
    `,
    [quizId],
  );

  return res.status(200).json({ questions: result.rows });
});

router.post("/completions", requireAuth, async (req, res) => {
  const parsed = completionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsed.error.flatten() });
  }

  const { quizId, score, pointsEarned } = parsed.data;

  try {
    const completion = await withTransaction(async (client) => {
      const completionResult = await client.query(
        `
          INSERT INTO quiz_completions (user_id, quiz_id, score, points_earned)
          VALUES ($1, $2, $3, $4)
          RETURNING id, user_id, quiz_id, score, points_earned, completed_at
        `,
        [req.user.id, quizId, score, pointsEarned],
      );

      await client.query("UPDATE users SET eco_points = eco_points + $1, updated_at = now() WHERE id = $2", [
        pointsEarned,
        req.user.id,
      ]);

      return completionResult.rows[0];
    });

    return res.status(201).json({ completion });
  } catch (error) {
    const isDuplicate = error.code === "23505";
    return res.status(isDuplicate ? 409 : 500).json({
      error: isDuplicate ? "Este quiz ya fue completado por el usuario" : "No se pudo guardar la completion",
    });
  }
});

router.get("/completions/mine", requireAuth, async (req, res) => {
  const result = await query(
    `
      SELECT
        qc.id,
        qc.score,
        qc.points_earned,
        qc.completed_at,
        q.id AS quiz_id,
        q.title,
        q.points_reward
      FROM quiz_completions qc
      JOIN quizzes q ON q.id = qc.quiz_id
      WHERE qc.user_id = $1
      ORDER BY qc.completed_at DESC
    `,
    [req.user.id],
  );

  const completions = result.rows.map((row) => ({
    id: row.id,
    score: row.score,
    points_earned: row.points_earned,
    completed_at: row.completed_at,
    quizzes: {
      id: row.quiz_id,
      title: row.title,
      points_reward: row.points_reward,
    },
  }));

  return res.status(200).json({ completions });
});

export default router;
