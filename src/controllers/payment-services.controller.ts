import { Request, Response } from "express";
import { createPaymentService, getPaymentServices, getPaymentServiceById, updatePaymentService, activatePaymentService, deactivatePaymentService, deletePaymentService, getUserPaymentService, getPaymentServiceBySlug } from "../services/payment-services.service";
import { __ } from "../utils/i18n";
import { createPaymentServiceSchema, getPaymentServicesSchema, updatePaymentServiceSchema, activatePaymentServiceSchema, deactivatePaymentServiceSchema, deletePaymentServiceSchema, getPaymentServiceBySlugSchema } from "../schemas/payment-services.schema";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    roleId: number;
  };
}

export const createPaymentServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Add user context to the data
        const dataWithUser = {
            ...req.body,
            ownerId: req.user?.userId || 1, // Default to user ID 1 if not authenticated
            userId: req.user?.userId || 1, // Default to user ID 1 if not authenticated
        };
        
        const paymentService = await createPaymentService(dataWithUser, req.user?.roleId, req.user?.userId);
        
        // Check if this was an update (existing service) or creation (new service)
        const isUpdate = req.method === 'PUT' && paymentService.id;
        
        res.status(isUpdate ? 200 : 201).json({
            success: true,
            message: isUpdate ? __('payment_service.updated_successfully') : __('payment_service.created_successfully'),
            data: paymentService,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getPaymentServicesHandler = async (req: Request, res: Response) => {
    try {
        // Use validated query data from middleware
        const queryData = (req as any).validatedQuery || req.query;
        const result = await getPaymentServices(queryData);
        
        res.status(200).json({
            success: true,
            message: __('payment_service.retrieved_successfully'),
            ...result,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getPaymentServiceByIdHandler = async (req: Request, res: Response) => {
    try {
        // Use validated params data from middleware
        const params = (req as any).validatedParams || req.params;
        const { id } = params;
        const paymentService = await getPaymentServiceById(Number(id));
        
        res.status(200).json({
            success: true,
            message: __('payment_service.retrieved_successfully'),
            data: paymentService,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

export const updatePaymentServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Use validated params data from middleware
        const params = (req as any).validatedParams || req.params;
        const validatedData = updatePaymentServiceSchema.parse({
            body: req.body,
            params: params
        });
        
        const paymentService = await updatePaymentService(Number(validatedData.params.id), validatedData.body, req.user?.roleId, req.user?.userId);
        
        res.status(200).json({
            success: true,
            message: __('payment_service.updated_successfully'),
            data: paymentService,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const activatePaymentServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Use validated params data from middleware
        const params = (req as any).validatedParams || req.params;
        const validatedData = activatePaymentServiceSchema.parse({
            params: params
        });
        
        const paymentService = await activatePaymentService(Number(validatedData.params.id), req.user?.roleId, req.user?.userId);
        
        res.status(200).json({
            success: true,
            message: __('payment_service.activated_successfully'),
            data: paymentService,
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('already active') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const deactivatePaymentServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Use validated params data from middleware
        const params = (req as any).validatedParams || req.params;
        const validatedData = deactivatePaymentServiceSchema.parse({
            params: params
        });
        
        const paymentService = await deactivatePaymentService(Number(validatedData.params.id), req.user?.roleId, req.user?.userId);
        
        res.status(200).json({
            success: true,
            message: __('payment_service.deactivated_successfully'),
            data: paymentService,
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('already inactive') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const deletePaymentServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Use validated params data from middleware
        const params = (req as any).validatedParams || req.params;
        const validatedData = deletePaymentServiceSchema.parse({
            params: params
        });
        
        const result = await deletePaymentService(Number(validatedData.params.id), req.user?.roleId, req.user?.userId);
        
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const getUserPaymentServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const ownerId = req.user?.userId;
        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: __('auth.unauthorized'),
            });
        }
        
        const paymentService = await getUserPaymentService(ownerId);
        
        if (!paymentService) {
            return res.status(404).json({
                success: false,
                message: __('payment_service.not_found'),
            });
        }
        
        res.status(200).json({
            success: true,
            message: __('payment_service.retrieved_successfully'),
            data: paymentService,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getPaymentServiceBySlugHandler = async (req: Request, res: Response) => {
    try {
        // Use validated params data from middleware
        const params = (req as any).validatedParams || req.params;
        const validatedData = getPaymentServiceBySlugSchema.parse({
            params: params
        });
        
        const paymentService = await getPaymentServiceBySlug(validatedData.params.slug);
        
        res.status(200).json({
            success: true,
            message: __('payment_service.retrieved_successfully'),
            data: paymentService,
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};
