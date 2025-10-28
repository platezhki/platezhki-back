import { Request, Response } from "express";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { loginUser, registerUser, refreshToken, logoutUser } from "../services/auth.service";
import { __ } from "../utils/i18n";

export const loginHandler = async (req: Request<{},{}, LoginInput>, res: Response) => {
    try {
        const { username, password } = req.body;
        const result = await loginUser(username, password);
        
        res.status(200).json({ 
            success: true,
            message: __('auth.login_success'),
            data: {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            }
        });
    } catch (error: any) {
        const statusCode = error.message.includes(__('auth.user_not_found')) || 
                         error.message.includes(__('auth.invalid_password')) ? 401 : 500;
        return res.status(statusCode).json({ 
            success: false,
            message: error.message || __('general.server_error') 
        });
    }
};

export const registerHandler = async (req: Request<{},{}, RegisterInput>, res: Response) => {
    try {
        const { username, password, email, roleId } = req.body;
        const user = await registerUser(username, password, email, roleId);
        res.status(201).json({ 
            success: true,
            message: __('auth.registration_success'),
            data: { user }
        });
    } catch (error: any) {
        const statusCode = error.message.includes(__('auth.username_exists')) || 
                         error.message.includes(__('auth.email_exists')) ? 400 : 500;
        return res.status(statusCode).json({ 
            success: false,
            message: error.message || __('general.server_error') 
        });
    }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
    try {
        const { refreshToken: token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: __('auth.refresh_token_required')
            });
        }

        const result = await refreshToken(token);
        
        res.status(200).json({
            success: true,
            message: __('auth.token_refreshed'),
            data: result
        });
    } catch (error: any) {
        const statusCode = error.message.includes(__('auth.invalid_refresh_token')) || 
                         error.message.includes(__('auth.refresh_token_expired')) ? 401 : 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || __('general.server_error')
        });
    }
};

export const logoutHandler = async (req: Request, res: Response) => {
    try {
        const { refreshToken: token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: __('auth.refresh_token_required')
            });
        }

        const result = await logoutUser(token);
        
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || __('general.server_error')
        });
    }
};