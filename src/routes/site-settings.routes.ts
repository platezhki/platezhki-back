import { Router } from "express";
import {
    getSiteSettingsHandler,
    updateSiteSettingsHandler
} from "../controllers/site-settings.controller";
import { authenticateToken } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/authorize-roles";

const router = Router();

router.get("/", getSiteSettingsHandler);

router.put("/", authenticateToken, requireAdmin(), updateSiteSettingsHandler);

export default router;

