import { Router } from "express";
import { loginHandler, refreshTokenHandler, logoutHandler, registerHandler, googleLoginHandler, requestPasswordResetHandler, resetPasswordWithCodeHandler } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.post("/refresh", authenticateToken, refreshTokenHandler);
router.post("/logout", authenticateToken, logoutHandler);
router.post("/google", googleLoginHandler);
router.post("/password/request-reset", requestPasswordResetHandler);
router.post("/password/reset", resetPasswordWithCodeHandler);

export default router;
