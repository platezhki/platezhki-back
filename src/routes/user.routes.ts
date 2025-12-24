import { Router } from "express";
import { getUsersHandler, getUserHandler, getCurrentUserHandler, updateUserHandler, createUserHandler, getActiveUsersCountHandler, sendMyEmailVerificationHandler, verifyMyEmailCodeHandler, getUsersAdminHandler, updateUserAdminHandler, getTokenByUserIdHandler } from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth";
import { requireAdminOrModerator } from "../middlewares/authorize-roles";
import validate, { validateQuery, validateParams, validateBody } from "../middlewares/validate";
import { updateUserSchema, getUsersAdminSchema, updateUserAdminSchema } from "../schemas/user.schema";
import { createOrUpdateRatingHandler, getRatingsHandler, getAverageRatingHandler, deleteRatingHandler, updateRatingHandler } from "../controllers/user-rating.controller";
import { createReplyHandler, getRepliesHandler, updateReplyHandler, deleteReplyHandler } from "../controllers/user-rating-reply.controller";
import { createUserRatingSchema, updateUserRatingSchema, getRatingsSchema, createUserRatingReplySchema, getUserRatingRepliesSchema, updateUserRatingReplySchema, deleteUserRatingReplySchema } from "../schemas/user-rating.schema";

const router = Router();

router.get("/", authenticateToken, getUsersHandler);
router.get("/me", authenticateToken, getCurrentUserHandler);
// Active users count endpoint (sets httpOnly cookie for anonymous devices)
router.get('/active/count', getActiveUsersCountHandler);
router.get("/admin", authenticateToken, requireAdminOrModerator(), validateQuery(getUsersAdminSchema.shape.query), getUsersAdminHandler);
router.patch("/admin/:id", authenticateToken, requireAdminOrModerator(), validateParams(updateUserAdminSchema.shape.params), validateBody(updateUserAdminSchema.shape.body), updateUserAdminHandler);
router.get(
  '/token/:userId',
  authenticateToken,
  requireAdminOrModerator(),
  getTokenByUserIdHandler
);
router.get("/:id",authenticateToken, getUserHandler);
router.put("/", authenticateToken, requireAdminOrModerator(), createUserHandler);
router.patch("/", authenticateToken, validate(updateUserSchema), updateUserHandler);

// Email verification for current user
router.post('/email/send-code', authenticateToken, sendMyEmailVerificationHandler);
router.post('/email/verify', authenticateToken, verifyMyEmailCodeHandler);

router.post('/:id/ratings', authenticateToken, validate(createUserRatingSchema), createOrUpdateRatingHandler);
router.get('/:id/ratings', authenticateToken, validateQuery(getRatingsSchema.shape.query), getRatingsHandler);
router.get('/:id/ratings/average', authenticateToken, getAverageRatingHandler);
router.patch('/:id/ratings/:ratingId', authenticateToken, validate(updateUserRatingSchema), updateRatingHandler);
router.delete('/:id/ratings/:ratingId', authenticateToken, deleteRatingHandler);

// Replies
router.post('/:id/ratings/:ratingId/replies', authenticateToken, validate(createUserRatingReplySchema), createReplyHandler);
router.get('/:id/ratings/:ratingId/replies', validateQuery(getUserRatingRepliesSchema.shape.query), getRepliesHandler);
router.patch('/:id/ratings/:ratingId/replies/:replyId', authenticateToken, validate(updateUserRatingReplySchema), updateReplyHandler);
router.delete('/:id/ratings/:ratingId/replies/:replyId', authenticateToken, validate(deleteUserRatingReplySchema), deleteReplyHandler);

export default router;
