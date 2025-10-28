import { Router } from "express";
import publicRoutes from "./public.routes";
import privateRoutes from "./private.routes";

const router = Router();

// Public routes (no authentication required) - register first
router.use("/", publicRoutes);

// Private routes (authentication required) - register after to take precedence
router.use("/", privateRoutes);

export default router;