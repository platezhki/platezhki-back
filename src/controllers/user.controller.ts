import { Request, Response } from "express";
import { getUser, getUsers, getCurrentUser, updateUser, createUser } from "../services/user.service";
import { touchUserActivity, countActiveUsers } from "../services/user.service";
import { __ } from "../utils/i18n";

export const getUsersHandler = async (req: Request, res: Response) => {
    try {
        const users = await getUsers();
        res.status(200).json({
            success: true,
            message: __('user.users_retrieved_successfully'),
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: __('user.users_retrieval_failed')
        });
    }
};

export const getUserHandler = async (req: Request, res: Response) => {
    try {
        const user = await getUser(Number(req.params.id));
        res.status(200).json({
            success: true,
            message: __('user.user_retrieved_successfully'),
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        if (error instanceof Error && error.message === __('user.user_not_found')) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: __('user.user_retrieval_failed')
            });
        }
    }
};

export const getCurrentUserHandler = async (req: Request, res: Response) => {
    // Check if user is authenticated - FIRST THING, NO TRY/CATCH
    const user = (req as any).user;
    const userId = user?.userId;

    // Return 401 immediately if no authentication
    if (!user || !userId) {
        return res.status(401).json({
            success: false,
            message: __('auth.unauthorized')
        });
    }

    // Only proceed if authenticated
    try {
        const userData = await getCurrentUser(userId);
        res.status(200).json({
            success: true,
            message: __('user.current_user_retrieved_successfully'),
            data: userData
        });
    } catch (error) {
        console.error('Error fetching current user:', error);
        if (error instanceof Error && error.message === __('user.user_not_found')) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: __('user.current_user_retrieval_failed')
            });
        }
    }
};

export const createUserHandler = async (req: Request, res: Response) => {
    try {
        // Check if user is authenticated
        const user = (req as any).user;
        const userId = user?.userId;

        // Return 401 if no user or no userId
        if (!user || !userId) {
            return res.status(401).json({
                success: false,
                message: __('auth.unauthorized')
            });
        }

        const { username, email, password, roleId } = req.body;
        const createData = { username, email, password, roleId };

        const newUser = await createUser(createData, userId);
        res.status(201).json({
            success: true,
            message: __('user.user_created_successfully'),
            data: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error instanceof Error) {
            if (error.message === __('auth.username_exists') || error.message === __('auth.email_exists')) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: __('user.user_creation_failed')
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: __('user.user_creation_failed')
            });
        }
    }
};

export const updateUserHandler = async (req: Request, res: Response) => {
    try {
        // Check if user is authenticated
        const user = (req as any).user;
        const userId = user?.userId;

        // Return 401 if no user or no userId
        if (!user || !userId) {
            return res.status(401).json({
                success: false,
                message: __('auth.unauthorized')
            });
        }

        const { username, email, roleId } = req.body;
        const updateData: { username?: string; email?: string; roleId?: number } = {};

        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (roleId !== undefined) updateData.roleId = roleId;

        const updatedUser = await updateUser(userId, updateData);
        res.status(200).json({
            success: true,
            message: __('user.user_updated_successfully'),
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error instanceof Error) {
            if (error.message === __('user.user_not_found')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else if (error.message === __('auth.username_exists') || error.message === __('auth.email_exists')) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                message: __('user.user_update_failed')
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: __('user.user_update_failed')
            });
        }
    }
};

// Returns number of active users (unique devices) seen within the last 5 minutes.
// Also sets an httpOnly cookie `pa_device` with a unique hash on first visit.
export const getActiveUsersCountHandler = async (req: Request, res: Response) => {
    try {
        const cookieName = 'pa_device';
        let cookieHash = req.cookies?.[cookieName] as string | undefined;

        // If no cookie, generate one and set httpOnly cookie
        if (!cookieHash) {
            const crypto = await import('crypto');
            cookieHash = crypto.randomBytes(20).toString('hex');
            // Set cookie for 30 days
            res.cookie(cookieName, cookieHash, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
        }

        // If user authenticated, attach userId
        const user = (req as any).user;
        const userId = user?.userId ? Number(user.userId) : undefined;

        // Touch activity
        await touchUserActivity(cookieHash, userId);

        // Count active in last 5 minutes
        const activeCount = await countActiveUsers(5);

        res.status(200).json({ success: true, data: { activeCount } });
    } catch (error) {
        console.error('getActiveUsersCountHandler error', error);
        res.status(500).json({ success: false, message: __('user.active_count_failed') });
    }
};
