import { Router } from "express";
import { getUsersHandler, getUserHandler, getCurrentUserHandler, updateUserHandler, createUserHandler, getActiveUsersCountHandler } from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth";
import { requireAdminOrModerator } from "../middlewares/authorize-roles";
import { createOrUpdateRatingHandler, getRatingsHandler, getAverageRatingHandler, deleteRatingHandler, updateRatingHandler } from "../controllers/user-rating.controller";
import validate from "../middlewares/validate";
import { createUserRatingSchema, updateUserRatingSchema } from "../schemas/user-rating.schema";

const router = Router();

router.get("/", authenticateToken, getUsersHandler);
router.get("/me", authenticateToken, getCurrentUserHandler);
// Active users count endpoint (sets httpOnly cookie for anonymous devices)
router.get('/active/count', getActiveUsersCountHandler);
router.get("/:id",authenticateToken, getUserHandler);
router.put("/", authenticateToken, requireAdminOrModerator(), createUserHandler);
router.patch("/", authenticateToken, updateUserHandler);

router.post('/:id/ratings', authenticateToken, validate(createUserRatingSchema), createOrUpdateRatingHandler);
router.get('/:id/ratings', authenticateToken, getRatingsHandler);
router.get('/:id/ratings/average', authenticateToken, getAverageRatingHandler);
router.patch('/:id/ratings/:ratingId', authenticateToken, validate(updateUserRatingSchema), updateRatingHandler);
router.delete('/:id/ratings/:ratingId', authenticateToken, deleteRatingHandler);

export default router;
