import { Request, Response } from "express";
import {
  getUser,
  getUsers,
  getCurrentUser,
  updateUser,
  createUser,
  sendEmailVerificationCode,
  verifyEmailCode,
  getUsersAdmin,
  updateUserAdmin,
  getTokenByUserId
} from "../services/user.service";
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
    res.status(200).json({ success: true, message: __('user.user_retrieved_successfully'), data: user });
  } catch (error: any) {
    const msg = error?.message;
    if (msg === __('user.user_not_found')) {
      return res.status(404).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: __('general.server_error') });
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
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: __('general.unauthorized') });
    const { username, password } = req.body;
    const updatedUser = await updateUser(Number(userId), { username, password });
    res.status(200).json({ success: true, message: __('user.user_updated_successfully'), data: updatedUser });
  } catch (error: any) {
    const msg = error?.message;
    if (msg === __('user.user_not_found')) {
      return res.status(404).json({ success: false, message: msg });
    }
    if (msg === __('auth.username_exists')) {
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: __('general.server_error') });
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

export const sendMyEmailVerificationHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: __('general.unauthorized') });
    const result = await sendEmailVerificationCode(Number(userId));
    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    const msg = error?.message;
    const known = [__('user.user_not_found'), __('general.server_error'), __('auth.email_already_verified')];
    const status = msg === __('user.user_not_found') ? 404 : known.includes(msg) ? 400 : 500;
    return res.status(status).json({ success: false, message: known.includes(msg) ? msg : __('general.server_error') });
  }
};

export const verifyMyEmailCodeHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { code } = req.body || {};
    if (!userId) return res.status(401).json({ success: false, message: __('general.unauthorized') });
    if (!code) return res.status(400).json({ success: false, message: __('auth.email_and_code_required') });
    const result = await verifyEmailCode(Number(userId), code);
    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    const msg = error?.message;
    const known = [__('user.user_not_found'), __('auth.email_code_invalid'), __('auth.email_code_expired')];
    const status = msg === __('user.user_not_found') ? 404 : known.includes(msg) ? 400 : 500;
    return res.status(status).json({ success: false, message: known.includes(msg) ? msg : __('general.server_error') });
  }
};

export const getUsersAdminHandler = async (req: Request, res: Response) => {
  try {
    const query = (req as any).validatedQuery || req.query;
    const result = await getUsersAdmin(query as any);
    res.status(200).json({ success: true, message: __('user.users_retrieved_successfully'), ...result });
  } catch (error) {
    console.error('Error fetching users (admin):', error);
    res.status(500).json({ success: false, message: __('user.users_retrieval_failed') });
  }
};

export const updateUserAdminHandler = async (req: Request, res: Response) => {
  try {
    const id = Number((req as any).validatedParams?.id ?? req.params.id);
    const body = req.body;
    const result = await updateUserAdmin(id, body);
    return res.status(200).json({ success: true, message: __('user.user_updated_successfully'), data: result });
  } catch (error: any) {
    const msg = error?.message;
    const notFoundKeys = [__('user.user_not_found'), 'user.user_not_found'];
    const usernameExistsKeys = [__('auth.username_exists'), 'auth.username_exists'];
    const emailExistsKeys = [__('auth.email_exists'), 'auth.email_exists'];

    if (notFoundKeys.includes(msg)) {
      return res.status(404).json({ success: false, message: __('user.user_not_found') });
    }
    if (usernameExistsKeys.includes(msg)) {
      return res.status(400).json({ success: false, message: __('auth.username_exists') });
    }
    if (emailExistsKeys.includes(msg)) {
      return res.status(400).json({ success: false, message: __('auth.email_exists') });
    }
    return res.status(500).json({ success: false, message: __('general.server_error') });
  }
};

export const getTokenByUserIdHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: __('general.invalid_request') });
    }
    const result = await getTokenByUserId(userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
