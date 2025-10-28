import { Request, Response, NextFunction } from 'express';
import { __ } from '../utils/i18n';

/**
 * Middleware to authorize users based on their roles
 * @param allowedRoles - Array of role IDs that are allowed to access the endpoint
 * @returns Express middleware function
 */
export const authorizeRoles = (allowedRoles: number[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if user is authenticated
            const user = (req as any).user;
            
            if (!user || !user.roleId) {
                return res.status(401).json({
                    success: false,
                    message: __('auth.unauthorized')
                });
            }

            // Check if user's role is in the allowed roles
            if (!allowedRoles.includes(user.roleId)) {
                return res.status(403).json({
                    success: false,
                    message: __('auth.insufficient_permissions')
                });
            }

            // User is authorized, proceed to next middleware/handler
            next();
        } catch (error) {
            console.error('Error in role authorization:', error);
            return res.status(500).json({
                success: false,
                message: __('general.server_error')
            });
        }
    };
};

// Convenience functions for common role combinations
export const requireAdmin = () => authorizeRoles([1]); // Only admin (roleId 1)
export const requireAdminOrModerator = () => authorizeRoles([1, 2]); // Admin or moderator
export const requireAdminOrModeratorOrUser = () => authorizeRoles([1, 2, 3, 4]); // All roles
