import { Router, Request, Response } from "express";
import prisma from "../infrastructure/prismaClient";
import { authMiddleware } from "../infrastructure/auth";

export const localRouter = Router();

// Mapea la respuesta de Prisma (nombres de relaciones) a nombres de tablas como espera Supabase
const mapPrismaToSupabase = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(mapPrismaToSupabase);
  if (typeof data === 'object' && !(data instanceof Date)) {
    const mapped: any = { ...data };
    
    // Convertir propiedades hijas recursivamente primero
    for (const key in mapped) {
      if (typeof mapped[key] === 'object' && mapped[key] !== null) {
        mapped[key] = mapPrismaToSupabase(mapped[key]);
      }
    }

    if (mapped.station !== undefined) {
      mapped.waste_stations = mapped.station;
      delete mapped.station;
    }
    if (mapped.bin !== undefined) {
      mapped.waste_bins = mapped.bin;
      delete mapped.bin;
    }
    if (mapped.user !== undefined) {
      mapped.profiles = mapped.user;
      delete mapped.user;
    }
    if (mapped.product !== undefined) {
      mapped.products = mapped.product;
      delete mapped.product;
    }
    if (mapped.quiz !== undefined) {
      mapped.quizzes = mapped.quiz;
      delete mapped.quiz;
    }
    if (mapped.author !== undefined) {
      mapped.profiles = mapped.author;
      delete mapped.author;
    }
    return mapped;
  }
  return data;
};

const getModel = (table: string) => {
  const model = (prisma as any)[table];
  if (!model) throw new Error(`Tabla no soportada: ${table}`);
  return model;
};

localRouter.get("/:table", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const model = getModel(table);
    const where: Record<string, any> = {};

    Object.entries(req.query).forEach(([key, value]) => {
      if (key.startsWith("eq_")) {
        where[key.slice(3)] = value;
      }
    });

    const orderBy = req.query.order ? { [String(req.query.order)]: String(req.query.ascending) !== "false" ? "asc" : "desc" } : undefined;
    const take = req.query.limit ? Number(req.query.limit) : undefined;
    const include =
      table === "waste_bins"
        ? { station: true }
        : table === "waste_stations"
          ? { waste_bins: true }
          : table === "transactions"
            ? { user: true, bin: { include: { station: true } } }
            : table === "redemptions"
              ? { user: true, product: true }
              : table === "quiz_questions"
                ? { quiz: true }
                : table === "quiz_completions"
                  ? { user: true, quiz: true }
                  : table === "news_articles"
                    ? { author: true }
                    : undefined;

    const data = await model.findMany({
      where,
      orderBy: orderBy as any,
      take,
      include,
    });

    if (req.query.head === "true") {
      const count = await model.count({ where });
      return res.json({ count });
    }

    return res.json(mapPrismaToSupabase(data));
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

localRouter.get("/:table/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params;
    const model = getModel(table);
    const include =
      table === "waste_bins"
        ? { station: true }
        : table === "waste_stations"
          ? { waste_bins: true }
          : table === "transactions"
            ? { user: true, bin: { include: { station: true } } }
            : table === "redemptions"
              ? { user: true, product: true }
              : table === "quiz_questions"
                ? { quiz: true }
                : table === "quiz_completions"
                  ? { user: true, quiz: true }
                  : table === "news_articles"
                    ? { author: true }
                    : undefined;
    const data = await model.findUnique({ where: { id }, include });

    if (!data) return res.status(404).json({ error: "Registro no encontrado" });
    return res.json(mapPrismaToSupabase(data));
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

localRouter.post("/:table", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const model = getModel(table);
    if (Array.isArray(req.body)) {
      const data = await Promise.all(req.body.map((item: any) => model.create({ data: item })));
      return res.status(201).json(mapPrismaToSupabase(data));
    }
    const data = await model.create({ data: req.body });
    return res.status(201).json(mapPrismaToSupabase(data));
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

localRouter.put("/:table/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params;
    const model = getModel(table);
    const data = await model.update({ where: { id }, data: req.body });
    return res.json(mapPrismaToSupabase(data));
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

localRouter.delete("/:table/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params;
    const model = getModel(table);
    await model.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
