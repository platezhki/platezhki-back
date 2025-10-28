import { PrismaClient } from "../generated/prisma";
import { hashPassword, comparePasswords } from "../utils/crypto";
import { __ } from "../utils/i18n";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt";

const prisma = new PrismaClient();

export const loginUser = async (username: string, password: string) => {
    try {
        const user = await prisma.user.findFirst({
            where: {
                username,
            },
            include: {
                role: true,
            },
        });

        if (!user) {
            throw new Error(__('auth.user_not_found'));
        }

        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
            throw new Error(__('auth.invalid_password'));
        }

        // Generate JWT tokens
        const { accessToken, refreshToken, tokenId } = generateTokenPair({
            id: user.id,
            username: user.username,
            roleId: user.roleId,
        });

        // Calculate expiration date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Store refresh token in database
        await prisma.authToken.create({
            data: {
                userId: user.id,
                token: accessToken,
                refreshToken,
                expiresAt,
            },
        });

        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    } catch (error) {
        throw error;
    }
};

export const registerUser = async (username: string, password: string, email: string, roleId: number = 1) => {
    try {
        // Check for existing username
        const existingUsername = await prisma.user.findFirst({
            where: { username }
        });

        if (existingUsername) {
            throw new Error(__('auth.username_exists'));
        }

        // Check for existing email
        const existingEmail = await prisma.user.findFirst({
            where: { email }
        });

        if (existingEmail) {
            throw new Error(__('auth.email_exists'));
        }

        const hashedPassword = await hashPassword(password);

        // Find an existing admin user to use as owner, or use self-reference
        const adminUser = await prisma.user.findFirst({
            where: { roleId: 1 }, // Find any admin user
            select: { id: true }
        });

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                email,
                roleId,
                ownerId: adminUser?.id || 1, // Use admin user ID or fallback to our created admin
            },
            include: {
                role: true,
            },
        });

        // Update user to be their own owner
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { ownerId: user.id },
            include: { role: true }
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};

export const refreshToken = async (refreshToken: string) => {
    try {
        // Verify the refresh token
        const payload = verifyRefreshToken(refreshToken);
        
        // Find the token in database
        const authToken = await prisma.authToken.findFirst({
            where: {
                refreshToken,
                userId: payload.userId,
            },
            include: {
                user: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!authToken) {
            throw new Error(__('auth.invalid_refresh_token'));
        }

        // Check if token is expired
        if (authToken.expiresAt < new Date()) {
            // Delete expired token
            await prisma.authToken.delete({
                where: { id: authToken.id },
            });
            throw new Error(__('auth.refresh_token_expired'));
        }

        // Generate new token pair
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, tokenId } = generateTokenPair({
            id: authToken.user.id,
            username: authToken.user.username,
            roleId: authToken.user.roleId,
        });

        // Calculate new expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Update the token in database
        await prisma.authToken.update({
            where: { id: authToken.id },
            data: {
                token: newAccessToken,
                refreshToken: newRefreshToken,
                expiresAt,
            },
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    } catch (error) {
        throw error;
    }
};

export const logoutUser = async (refreshToken: string) => {
    try {
        // Find and delete the token
        const authToken = await prisma.authToken.findFirst({
            where: { refreshToken },
        });

        if (authToken) {
            await prisma.authToken.delete({
                where: { id: authToken.id },
            });
        }

        return { message: __('auth.logout_success') };
    } catch (error) {
        throw error;
    }
};

