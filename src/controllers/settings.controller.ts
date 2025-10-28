import { Request, Response } from "express";
import { 
    createSetting, 
    getSettings, 
    getSetting, 
    getSettingByName, 
    updateSetting 
} from "../services/settings.service";
import { __ } from "../utils/i18n";

export const createSettingHandler = async (req: Request, res: Response) => {
    try {
        const setting = await createSetting(req.body);
        
        res.status(201).json({
            success: true,
            message: __('settings.created_successfully'),
            data: setting,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getSettingsHandler = async (req: Request, res: Response) => {
    try {
        const result = await getSettings(req.query);
        
        res.status(200).json({
            success: true,
            message: __('settings.retrieved_successfully'),
            ...result,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getSettingHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const setting = await getSetting(Number(id));
        
        res.status(200).json({
            success: true,
            message: __('settings.retrieved_successfully'),
            data: setting,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

export const getSettingByNameHandler = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const setting = await getSettingByName(name);
        
        res.status(200).json({
            success: true,
            message: __('settings.retrieved_successfully'),
            data: setting,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateSettingHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const setting = await updateSetting(Number(id), req.body);
        
        res.status(200).json({
            success: true,
            message: __('settings.updated_successfully'),
            data: setting,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};
