import { Router } from "express";
import { getUsersHandler, getUserHandler, getCurrentUserHandler, updateUserHandler, createUserHandler } from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth";
import { requireAdminOrModerator } from "../middlewares/authorize-roles";

const router = Router();

router.get("/", authenticateToken, getUsersHandler);
router.get("/me", authenticateToken, getCurrentUserHandler);
router.get("/:id",authenticateToken, getUserHandler);
router.put("/", authenticateToken, requireAdminOrModerator(), createUserHandler);
router.patch("/", authenticateToken, updateUserHandler);

export default router;