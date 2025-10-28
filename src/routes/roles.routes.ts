import { Router } from "express";
import { getRolesHandler, createRoleHandler, updateRoleHandler } from "../controllers/roles.controller";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

router.get("/", authenticateToken, getRolesHandler);
router.put("/", authenticateToken, createRoleHandler);
router.patch("/:id", authenticateToken, updateRoleHandler);

export default router;
