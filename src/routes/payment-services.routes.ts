import { Router } from "express";
import {
    createPaymentServiceHandler,
    getPaymentServicesHandler,
    getPaymentServiceByIdHandler,
    updatePaymentServiceHandler,
    activatePaymentServiceHandler,
    deactivatePaymentServiceHandler,
    deletePaymentServiceHandler,
    getUserPaymentServiceHandler,
    getPaymentServiceBySlugHandler,
    setPaymentServicePromotionHandler,
    clearPaymentServicePromotionHandler,
    adminGetPaymentServiceByUserIdHandler
} from "../controllers/payment-services.controller";
import {
    getPaymentServicesSchema,
    getPaymentServiceSchema,
    activatePaymentServiceSchema,
    deactivatePaymentServiceSchema,
    deletePaymentServiceSchema,
    getPaymentServiceBySlugSchema,
    createPaymentServiceBodySchema,
    updatePaymentServiceBodySchema
} from "../schemas/payment-services.schema";
import { validateQuery, validateParams, validateBody } from "../middlewares/validate";
import { authenticateToken } from "../middlewares/auth";
import {requireAdmin, requireAdminOrModerator} from "../middlewares/authorize-roles";

const router = Router();

router.get("/", authenticateToken, validateQuery(getPaymentServicesSchema.shape.query), getPaymentServicesHandler);
router.put("/", authenticateToken, validateBody(createPaymentServiceBodySchema), createPaymentServiceHandler);
router.get("/my", authenticateToken, getUserPaymentServiceHandler);
router.get("/slug/:slug", validateParams(getPaymentServiceBySlugSchema.shape.params), getPaymentServiceBySlugHandler);
router.get("/:id", authenticateToken, validateParams(getPaymentServiceSchema.shape.params), getPaymentServiceByIdHandler);
router.patch("/:id", authenticateToken, updatePaymentServiceHandler);
router.delete("/:id", authenticateToken, validateParams(deletePaymentServiceSchema.shape.params), deletePaymentServiceHandler);
router.post("/:id/activate", authenticateToken, validateParams(activatePaymentServiceSchema.shape.params), activatePaymentServiceHandler);
router.post("/:id/deactivate", authenticateToken, validateParams(deactivatePaymentServiceSchema.shape.params), deactivatePaymentServiceHandler);
router.put(
  "/:id/promotion",
  authenticateToken,
  requireAdminOrModerator(),
  validateParams(getPaymentServiceSchema.shape.params),
  validateBody(updatePaymentServiceBodySchema),
  setPaymentServicePromotionHandler
);
router.delete(
  "/:id/promotion",
  authenticateToken,
  requireAdminOrModerator(),
  validateParams(getPaymentServiceSchema.shape.params),
  clearPaymentServicePromotionHandler
);
router.get(
  "/admin/user/:userId",
  authenticateToken,
  requireAdminOrModerator(),
  adminGetPaymentServiceByUserIdHandler
);

export default router;
