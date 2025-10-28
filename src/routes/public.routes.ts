import { Router } from "express";
import authRoutes from "./auth.routes";
import dictionariesRoutes from "./dictionaries.routes";

const router = Router();

// Public routes - no authentication required
router.use("/auth", authRoutes);
router.use("/dictionaries", dictionariesRoutes);

export default router;
