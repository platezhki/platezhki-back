import { Router } from "express";
import userRoutes from "./user.routes";
import paymentServicesRoutes from "./payment-services.routes";
import settingsRoutes from "./settings.routes";
import { authenticateToken } from "../middlewares/auth";
import rolesRoutes from "./roles.routes";
import offersRoutes from "./offers.routes";

const router = Router();

// Private routes - authentication required
router.use("/users", userRoutes);
router.use("/payment-services", paymentServicesRoutes);
router.use("/settings", settingsRoutes);
router.use("/roles", rolesRoutes);
router.use("/offers", offersRoutes);

export default router;
