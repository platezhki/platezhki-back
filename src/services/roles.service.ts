import { PrismaClient } from "../generated/prisma";
import { __ } from "../utils/i18n";

const prisma = new PrismaClient();

export const getRoles = async () => {
    try {
        const roles = await prisma.role.findMany({
            orderBy: { id: 'asc' }
        });

        return roles;
    } catch (error) {
        throw error;
    }
};

export const createRole = async (name: string) => {
    try {
        // Check if role already exists
        const existingRole = await prisma.role.findFirst({
            where: {
                name,
            },
        });

        if (existingRole) {
            throw new Error(__('roles.name_exists'));
        }

        const role = await prisma.role.create({
            data: {
                name,
            },
        });

        return role;
    } catch (error) {
        throw error;
    }
};

export const updateRole = async (id: number, name: string) => {
    try {
        // Check if role exists
        const existingRole = await prisma.role.findFirst({
            where: {
                id,
            },
        });

        if (!existingRole) {
            throw new Error(__('roles.not_found'));
        }

        // Check if new name is already taken by another role
        const nameExists = await prisma.role.findFirst({
            where: {
                name,
                id: { not: id },
            },
        });

        if (nameExists) {
            throw new Error(__('roles.name_exists'));
        }

        const updatedRole = await prisma.role.update({
            where: {
                id,
            },
            data: {
                name,
            },
        });

        return updatedRole;
    } catch (error) {
        throw error;
    }
};
