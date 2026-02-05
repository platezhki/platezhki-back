import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const getSiteSettings = async () => {
    try {
        let settings = await prisma.siteSettings.findFirst();

        if (!settings) {
            settings = await prisma.siteSettings.create({
                data: {
                    maintenanceMode: false,
                },
            });
        }

        return settings;
    } catch (error) {
        throw error;
    }
};

export const updateSiteSettings = async (data: { maintenanceMode?: boolean }) => {
    try {
        let settings = await prisma.siteSettings.findFirst();

        if (!settings) {
            settings = await prisma.siteSettings.create({
                data: {
                    maintenanceMode: data.maintenanceMode ?? false,
                },
            });
        } else {
            settings = await prisma.siteSettings.update({
                where: { id: settings.id },
                data: {
                    maintenanceMode: data.maintenanceMode,
                },
            });
        }

        return settings;
    } catch (error) {
        throw error;
    }
};

export const isMaintenanceMode = async (): Promise<boolean> => {
    try {
        const settings = await getSiteSettings();
        return settings.maintenanceMode;
    } catch (error) {
        return false;
    }
};

