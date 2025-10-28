import { Router } from "express";
import { loginHandler, refreshTokenHandler, logoutHandler, registerHandler } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.post("/refresh", authenticateToken, refreshTokenHandler);
router.post("/logout", authenticateToken, logoutHandler);

export default router;