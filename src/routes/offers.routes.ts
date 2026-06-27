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
    getOfferRangesHandler,
    getOfferFilesHandler,
    uploadOfferFilesHandler,
    downloadOfferFileHandler,
    deleteOfferFileHandler
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
    createOfferSchema,
    updateOfferSchema,
    uploadOfferFileSchema,
    offerFileParamsSchema
} from "../schemas/offers.schema";
import { validateQuery, validateParams, validateBody } from "../middlewares/validate";
import { authenticateToken, optionalAuth } from "../middlewares/auth";

const router = Router();

// Public routes (no authentication required)
router.get("/", validateQuery(getOffersSchema.shape.query), getOffersHandler);
router.get("/ranges", getOfferRangesHandler);
router.get("/slug/:slug", validateParams(getOfferBySlugSchema.shape.params), getOfferBySlugHandler);
router.get("/filter", optionalAuth, validateQuery(filterOffersSchema.shape.query), filterOffersHandler);

// Private routes (authentication required) - specific routes first to avoid conflicts
router.get("/my", authenticateToken, validateQuery(getUserOffersSchema.shape.query), getUserOffersHandler);
router.put("/", authenticateToken, validateBody(createOfferSchema.shape.body), createOfferHandler);
router.post("/:id/activate", authenticateToken, validateParams(activateOfferSchema.shape.params), activateOfferHandler);
router.post("/:id/deactivate", authenticateToken, validateParams(deactivateOfferSchema.shape.params), deactivateOfferHandler);
router.patch("/:id", authenticateToken, validateParams(updateOfferSchema.shape.params), validateBody(updateOfferSchema.shape.body), updateOfferHandler);
router.delete("/:id", authenticateToken, validateParams(deleteOfferSchema.shape.params), deleteOfferHandler);

// Offer files
router.get("/:id/files", validateParams(getOfferSchema.shape.params), getOfferFilesHandler);
router.get("/:id/files/:fileId/download", validateParams(offerFileParamsSchema.shape.params), downloadOfferFileHandler);
router.post("/:id/files", authenticateToken, validateParams(uploadOfferFileSchema.shape.params), validateBody(uploadOfferFileSchema.shape.body), uploadOfferFilesHandler);
router.delete("/:id/files/:fileId", authenticateToken, validateParams(offerFileParamsSchema.shape.params), deleteOfferFileHandler);

// Public routes that need to be after specific routes to avoid conflicts
router.get("/:id", validateParams(getOfferSchema.shape.params), getOfferByIdHandler);

export default router;
