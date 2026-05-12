import { Router, Request, Response } from "express";
import { findTransactions, findBinByQr, createTransaction, getProfilePoints, updateProfilePoints } from "../infrastructure/repositories/transactionsRepository";

export const transactionsRouter = Router();

/**
 * @openapi
 * tags:
 *   name: Transactions
 *   description: Registro de escaneos QR y asignación de EcoPoints
 */

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     summary: Listar transacciones
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por usuario
 *     responses:
 *       200:
 *         description: Lista de transacciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
transactionsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const user_id = req.query.user_id as string | undefined;
    const data = await findTransactions(user_id ? { user_id } : undefined);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/transactions/scan:
 *   post:
 *     summary: Registrar escaneo de QR (flujo completo de reciclaje)
 *     description: |
 *       Registra un escaneo de QR en una estación de reciclaje.
 *       Asigna EcoPoints al usuario según el tipo de residuo:
 *       - Reciclable: 10 puntos
 *       - Orgánico: 8 puntos
 *       - No reciclable: 5 puntos
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, qr_code]
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del usuario que escanea
 *               qr_code:
 *                 type: string
 *                 example: "QR-MAIN-REC-001"
 *                 description: Código QR del contenedor
 *     responses:
 *       201:
 *         description: Transacción registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *                 points_earned:
 *                   type: integer
 *                 total_points:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: QR inválido o datos incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
transactionsRouter.post("/scan", async (req: Request, res: Response) => {
  const { user_id, qr_code } = req.body;
  if (!user_id || !qr_code) {
    return res.status(400).json({ error: "user_id y qr_code son requeridos" });
  }

  // Find bin by QR code
  const bin = await findBinByQr(qr_code);
  if (!bin) {
    return res.status(400).json({ error: "Código QR inválido o no encontrado" });
  }

  // Points by waste type
  const pointsMap: Record<string, number> = {
    recyclable: 10,
    organic: 8,
    non_recyclable: 5,
  };
  const points_earned = pointsMap[bin.waste_type] || 5;

  // Create transaction
  const transaction = await createTransaction({ user_id, bin_id: bin.id, points_earned, waste_type: bin.waste_type });

  // Update user eco_points
  const currentPoints = await getProfilePoints(user_id);
  const newPoints = (currentPoints || 0) + points_earned;
  await updateProfilePoints(user_id, newPoints);

  return res.status(201).json({
    transaction,
    points_earned,
    total_points: newPoints,
    message: `¡Excelente! Ganaste ${points_earned} EcoPoints por reciclar ${bin.waste_type}`,
  });
});
