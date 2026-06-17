import { Router } from "express";
import authRoutes from "./auth.routes";
import dictionariesRoutes from "./dictionaries.routes";
import { publicTelegramRouter } from "./telegram.routes";

const router = Router();

// Public routes - no authentication required
router.use("/auth", authRoutes);
router.use("/dictionaries", dictionariesRoutes);
router.use("/", publicTelegramRouter);

export default router;
