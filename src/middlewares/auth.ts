import { Request, Response, NextFunction } from 'express';
import { __ } from '../utils/i18n';
import { verifyAccessToken } from '../utils/jwt';

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

        // Verify the JWT token
        const decoded = verifyAccessToken(token);
        
        // Add user information to request
        (req as any).user = { 
            userId: decoded.userId,
            roleId: decoded.roleId 
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: __('general.unauthorized')
        });
    }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        // Mock user for testing - in real implementation, extract from JWT
        (req as any).user = { userId: 1 };
    }

    next();
};
