import { Request, Response, NextFunction } from 'express';
import { __ } from '../utils/i18n';
import { verifyAccessToken } from '../utils/jwt';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: __('general.unauthorized')
            });
        }

        const decoded = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, roleId: true, isActive: true }
        });
        if (!user || user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: __('auth.unauthorized')
            });
        }

        (req as any).user = {
            userId: user.id,
            roleId: user.roleId
        };

        // Update lastActivity asynchronously
        await (prisma as any).user.update({
            where: { id: user.id },
            data: { lastActivity: new Date() },
            select: { id: true }
        })

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: __('general.unauthorized')
        });
    }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        // In optional mode, try to decode and load role from DB if user exists
        try {
            const decoded = verifyAccessToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, roleId: true, isActive: true }
            });
            if (user && user.isActive !== false) {
                (req as any).user = {
                    userId: user.id,
                    roleId: user.roleId
                };
            }
        } catch {}
    }

    next();
};
