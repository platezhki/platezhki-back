import { Router } from "express";
import { 
    createSettingHandler, 
    getSettingsHandler, 
    getSettingHandler,
    getSettingByNameHandler,
    updateSettingHandler
} from "../controllers/settings.controller";
import { 
    getSettingsSchema, 
    getSettingSchema,
    getSettingByNameSchema
} from "../schemas/settings.schema";
import { validateQuery, validateParams } from "../middlewares/validate";

const router = Router();

router.post("/", createSettingHandler);
router.get("/", validateQuery(getSettingsSchema.shape.query), getSettingsHandler);
router.get("/:id", validateParams(getSettingSchema.shape.params), getSettingHandler);
router.get("/name/:name", validateParams(getSettingByNameSchema.shape.params), getSettingByNameHandler);
router.put("/:id", updateSettingHandler);

export default router;
