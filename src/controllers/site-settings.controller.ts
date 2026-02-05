import { Request, Response } from "express";
import { getSiteSettings, updateSiteSettings } from "../services/site-settings.service";
import { __ } from "../utils/i18n";

export const getSiteSettingsHandler = async (req: Request, res: Response) => {
    try {
        const settings = await getSiteSettings();

        res.status(200).json({
            success: true,
            message: __('site_settings.retrieved_successfully'),
            data: settings,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateSiteSettingsHandler = async (req: Request, res: Response) => {
    try {
        const { maintenanceMode } = req.body;

        const settings = await updateSiteSettings({ maintenanceMode });

        res.status(200).json({
            success: true,
            message: __('site_settings.updated_successfully'),
            data: settings,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

