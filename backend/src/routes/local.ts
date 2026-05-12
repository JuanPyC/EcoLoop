import { Router, Request, Response } from "express";
import prisma from "../infrastructure/prismaClient";

export const localRouter = Router();

const getModel = (table: string) => {
  const model = (prisma as any)[table];
  if (!model) throw new Error(`Tabla no soportada: ${table}`);
  return model;
};

localRouter.get("/:table", async (req: Request, res: Response) => {
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
            ? { user: true, bin: true }
            : table === "redemptions"
              ? { user: true, product: true }
              : table === "quiz_questions"
                ? { quiz: true }
                : table === "quiz_completions"
                  ? { user: true, quiz: true }
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

    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

localRouter.get("/:table/:id", async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params;
    const model = getModel(table);
    const include =
      table === "waste_bins"
        ? { station: true }
        : table === "waste_stations"
          ? { waste_bins: true }
          : table === "transactions"
            ? { user: true, bin: true }
            : table === "redemptions"
              ? { user: true, product: true }
              : table === "quiz_questions"
                ? { quiz: true }
                : table === "quiz_completions"
                  ? { user: true, quiz: true }
                  : undefined;
    const data = await model.findUnique({ where: { id }, include });

    if (!data) return res.status(404).json({ error: "Registro no encontrado" });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

localRouter.post("/:table", async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const model = getModel(table);
    if (Array.isArray(req.body)) {
      const data = await Promise.all(req.body.map((item) => model.create({ data: item })));
      return res.status(201).json(data);
    }
    const data = await model.create({ data: req.body });
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

localRouter.put("/:table/:id", async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params;
    const model = getModel(table);
    const data = await model.update({ where: { id }, data: req.body });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

localRouter.delete("/:table/:id", async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params;
    const model = getModel(table);
    await model.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
