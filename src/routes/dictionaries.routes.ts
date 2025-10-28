import { Router } from "express";
import { 
    getDictionariesHandler,
    createCurrencyHandler,
    updateCurrencyHandler,
    deleteCurrencyHandler,
    getCurrencyByIdHandler,
    createCountryHandler,
    updateCountryHandler,
    deleteCountryHandler,
    getCountryByIdHandler
} from "../controllers/dictionaries.controller";
import validate from "../middlewares/validate";
import { 
    createCurrencySchema, 
    updateCurrencySchema, 
    createCountrySchema, 
    updateCountrySchema 
} from "../schemas/dictionaries.schema";

const router = Router();

// Public routes
router.get("/", getDictionariesHandler);

// Admin routes for currencies
router.post("/currencies", validate(createCurrencySchema), createCurrencyHandler);
router.get("/currencies/:id", getCurrencyByIdHandler);
router.put("/currencies/:id", validate(updateCurrencySchema), updateCurrencyHandler);
router.delete("/currencies/:id", deleteCurrencyHandler);

// Admin routes for countries
router.post("/countries", validate(createCountrySchema), createCountryHandler);
router.get("/countries/:id", getCountryByIdHandler);
router.put("/countries/:id", validate(updateCountrySchema), updateCountryHandler);
router.delete("/countries/:id", deleteCountryHandler);

export default router;
