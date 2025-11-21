import { PrismaClient } from "../generated/prisma";
import { __ } from "../utils/i18n";

const prisma = new PrismaClient();

export const createSetting = async (data: any) => {
    try {
        // Check if setting with same name already exists
        const existingSetting = await prisma.setting.findUnique({
            where: {
                name: data.name,
            },
        });

        if (existingSetting) {
            throw new Error(__('settings.name_exists'));
        }

        const setting = await prisma.setting.create({
            data,
            include: {
                updatedByUser: true,
            },
        });

        return setting;
    } catch (error) {
        throw error;
    }
};

export const getSettings = async (filters: any = {}) => {
    try {
        const { page = 1, limit = 10, name } = filters;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};

        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive',
            };
        }

        const [settings, total] = await Promise.all([
            prisma.setting.findMany({
                where,
                skip,
                take: Number(limit),
                include: {
                    updatedByUser: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.setting.count({ where }),
        ]);

        return {
            data: settings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        };
    } catch (error) {
        throw error;
    }
};

export const getSetting = async (id: number) => {
    try {
        const setting = await prisma.setting.findUnique({
            where: {
                id,
            },
            include: {
                updatedByUser: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        if (!setting) {
            throw new Error(__('settings.not_found'));
        }

        return setting;
    } catch (error) {
        throw error;
    }
};

export const getSettingByName = async (name: string) => {
    try {
        const setting = await prisma.setting.findUnique({
            where: {
                name,
            },
            include: {
                updatedByUser: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        if (!setting) {
            throw new Error(__('settings.not_found'));
        }

        return setting;
    } catch (error) {
        throw error;
    }
};

export const updateSetting = async (id: number, data: any) => {
    try {
        const setting = await prisma.setting.update({
            where: {
                id,
            },
            data,
            include: {
                updatedByUser: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        return setting;
    } catch (error: any) {
        if (error?.code === 'P2025') {
            throw new Error(__('settings.not_found'));
        }
        throw error;
    }
};
