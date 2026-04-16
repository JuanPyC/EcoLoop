import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { query, withTransaction } from "../lib/db.js";

const router = Router();

const completionSchema = z.object({
  quizId: z.string().uuid(),
  score: z.number().int().min(0),
  pointsEarned: z.number().int().min(0),
});

const quizSchema = z.object({
  title: z.string().min(3),
  description: z.string().nullable().optional(),
  points_reward: z.number().int().min(1),
  is_active: z.boolean().optional(),
});

const quizQuestionSchema = z.object({
  question: z.string().min(3),
  correct_answer: z.string().min(1),
  wrong_answer_1: z.string().min(1),
  wrong_answer_2: z.string().min(1),
  wrong_answer_3: z.string().min(1),
  order_index: z.number().int().min(0),
});

router.get("/", async (req, res) => {
  const includeAll = req.query.all === "1";

  const result = await query(
    `
      SELECT id, title, description, points_reward, is_active, created_at
      FROM quizzes
      ${includeAll ? "" : "WHERE is_active = true"}
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

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const parsedQuiz = quizSchema.safeParse(req.body);
  if (!parsedQuiz.success) {
    return res.status(400).json({ error: "Datos invalidos", issues: parsedQuiz.error.flatten() });
  }

  const parsedQuestions = z.array(quizQuestionSchema).safeParse(req.body.questions ?? []);
  if (!parsedQuestions.success) {
    return res.status(400).json({ error: "Preguntas invalidas", issues: parsedQuestions.error.flatten() });
  }

  const created = await withTransaction(async (client) => {
    const quizResult = await client.query(
      `
        INSERT INTO quizzes (title, description, points_reward, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, description, points_reward, is_active, created_at
      `,
      [
        parsedQuiz.data.title,
        parsedQuiz.data.description ?? null,
        parsedQuiz.data.points_reward,
        parsedQuiz.data.is_active ?? true,
      ],
    );

    const quiz = quizResult.rows[0];

    for (const question of parsedQuestions.data) {
      await client.query(
        `
          INSERT INTO quiz_questions (quiz_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          quiz.id,
          question.question,
          question.correct_answer,
          question.wrong_answer_1,
          question.wrong_answer_2,
          question.wrong_answer_3,
          question.order_index,
        ],
      );
    }

    return quiz;
  });

  return res.status(201).json({ quiz: created });
});

router.post("/:quizId/questions", requireAuth, requireRole("admin"), async (req, res) => {
  const { quizId } = req.params;
  const parsedQuestions = z.array(quizQuestionSchema).safeParse(req.body);

  if (!parsedQuestions.success || !parsedQuestions.data.length) {
    return res.status(400).json({ error: "Preguntas invalidas", issues: parsedQuestions.success ? undefined : parsedQuestions.error.flatten() });
  }

  const inserted = [];
  for (const question of parsedQuestions.data) {
    const result = await query(
      `
        INSERT INTO quiz_questions (quiz_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, quiz_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, order_index
      `,
      [
        quizId,
        question.question,
        question.correct_answer,
        question.wrong_answer_1,
        question.wrong_answer_2,
        question.wrong_answer_3,
        question.order_index,
      ],
    );
    inserted.push(result.rows[0]);
  }

  return res.status(201).json({ questions: inserted });
});

router.delete("/:quizId", requireAuth, requireRole("admin"), async (req, res) => {
  const { quizId } = req.params;
  const result = await query("DELETE FROM quizzes WHERE id = $1 RETURNING id", [quizId]);

  if (!result.rows.length) {
    return res.status(404).json({ error: "Quiz no encontrado" });
  }

  return res.status(200).json({ ok: true });
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
