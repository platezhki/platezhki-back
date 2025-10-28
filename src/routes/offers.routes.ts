import { Router } from "express";
import {
    createOfferHandler,
    updateOfferHandler,
    activateOfferHandler,
    deactivateOfferHandler,
    deleteOfferHandler,
    getUserOffersHandler,
    getOffersHandler,
    getOfferByIdHandler,
    getOfferBySlugHandler,
    filterOffersHandler,
    getOfferRangesHandler
} from "../controllers/offers.controller";
import {
    getUserOffersSchema,
    deleteOfferSchema,
    activateOfferSchema,
    deactivateOfferSchema,
    getOffersSchema,
    getOfferSchema,
    getOfferBySlugSchema,
    filterOffersSchema,
    createOfferSchema
} from "../schemas/offers.schema";
import { validateQuery, validateParams, validateBody } from "../middlewares/validate";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

// Public routes (no authentication required)
router.get("/", validateQuery(getOffersSchema.shape.query), getOffersHandler);
router.get("/ranges", getOfferRangesHandler);
router.get("/slug/:slug", validateParams(getOfferBySlugSchema.shape.params), getOfferBySlugHandler);
router.get("/filter", validateQuery(filterOffersSchema.shape.query), filterOffersHandler);

// Private routes (authentication required) - specific routes first to avoid conflicts
router.get("/my", authenticateToken, validateQuery(getUserOffersSchema.shape.query), getUserOffersHandler);
router.put("/", authenticateToken, validateBody(createOfferSchema.shape.body), createOfferHandler);
router.post("/:id/activate", authenticateToken, validateParams(activateOfferSchema.shape.params), activateOfferHandler);
router.post("/:id/deactivate", authenticateToken, validateParams(deactivateOfferSchema.shape.params), deactivateOfferHandler);
router.patch("/:id", authenticateToken, updateOfferHandler);
router.delete("/:id", authenticateToken, validateParams(deleteOfferSchema.shape.params), deleteOfferHandler);

// Public routes that need to be after specific routes to avoid conflicts
router.get("/:id", validateParams(getOfferSchema.shape.params), getOfferByIdHandler);

export default router;
