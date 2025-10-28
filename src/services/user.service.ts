import { PrismaClient } from "../generated/prisma";
import { __ } from "../utils/i18n";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const getUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            where: {
                isActive: true,
            },
            include: {
                role: true,
            },
        });

        return users;
    } catch (error) {
        throw error;
    }
};

export const getUser = async (id: number) => {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                id,
            },
        });

        if (!existingUser) {
            throw new Error(__('user.user_not_found'));
        }

        return existingUser;
    } catch (error) {
        throw error;
    }
};

export const getCurrentUser = async (userId: number) => {
    try {
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                isActive: true,
            },
            include: {
                role: true,
            },
        });

        if (!user) {
            throw new Error(__('user.user_not_found'));
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};

export const createUser = async (createData: {
    username: string;
    email: string;
    password: string;
    roleId: number;
}, creatorUserId: number) => {
    try {
        // Check if username already exists
        const usernameExists = await prisma.user.findFirst({
            where: {
                username: createData.username,
            },
        });

        if (usernameExists) {
            throw new Error(__('auth.username_exists'));
        }

        // Check if email already exists
        const emailExists = await prisma.user.findFirst({
            where: {
                email: createData.email,
            },
        });

        if (emailExists) {
            throw new Error(__('auth.email_exists'));
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createData.password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                username: createData.username,
                email: createData.email,
                password: hashedPassword,
                roleId: createData.roleId,
                ownerId: creatorUserId,
            },
            include: {
                role: true,
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};

export const updateUser = async (userId: number, updateData: {
    username?: string;
    email?: string;
    roleId?: number;
}) => {
    try {
        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                id: userId,
                isActive: true,
            },
        });

        if (!existingUser) {
            throw new Error(__('user.user_not_found'));
        }

        // Check if username is already taken by another user
        if (updateData.username) {
            const usernameExists = await prisma.user.findFirst({
                where: {
                    username: updateData.username,
                    id: { not: userId },
                },
            });

            if (usernameExists) {
                throw new Error(__('auth.username_exists'));
            }
        }

        // Check if email is already taken by another user
        if (updateData.email) {
            const emailExists = await prisma.user.findFirst({
                where: {
                    email: updateData.email,
                    id: { not: userId },
                },
            });

            if (emailExists) {
                throw new Error(__('auth.email_exists'));
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data: updateData,
            include: {
                role: true,
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};