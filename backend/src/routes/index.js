import { Router } from "express";
import authRoutes from "./auth.routes.js";
import depositsRoutes from "./deposits.routes.js";
import newsRoutes from "./news.routes.js";
import productsRoutes from "./products.routes.js";
import profilesRoutes from "./profiles.routes.js";
import quizzesRoutes from "./quizzes.routes.js";
import redemptionsRoutes from "./redemptions.routes.js";
import stationsRoutes from "./stations.routes.js";
import workerRoutes from "./worker.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "ecoloop-backend",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/profiles", profilesRoutes);
router.use("/stations", stationsRoutes);
router.use("/deposits", depositsRoutes);
router.use("/products", productsRoutes);
router.use("/redemptions", redemptionsRoutes);
router.use("/news", newsRoutes);
router.use("/quizzes", quizzesRoutes);
router.use("/worker", workerRoutes);

export default router;
