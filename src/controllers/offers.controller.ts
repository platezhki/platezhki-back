import { Request, Response } from "express";
import { 
    createOffer, 
    getOffers, 
    getOfferById, 
    getOfferBySlug,
    updateOffer, 
    activateOffer, 
    deactivateOffer, 
    deleteOffer,
    getUserOffers,
    filterOffersAndGetPaymentServices,
    getOfferRanges
} from "../services/offers.service";
import { __ } from "../utils/i18n";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    roleId: number;
  };
}

export const createOfferHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Add user context to the data
        const dataWithUser = {
            ...req.body,
            ownerId: req.user?.userId
        };
        
        const offer = await createOffer(dataWithUser);
        
        res.status(201).json({
            success: true,
            message: __('offer.created_successfully'),
            data: offer,
        });
    } catch (error: any) {
        const statusCode = error.message.includes('already exists') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const getOffersHandler = async (req: Request, res: Response) => {
    try {
        // Use validated query data from middleware
        const queryData = (req as any).validatedQuery || req.query;
        const result = await getOffers(queryData);
        
        res.status(200).json({
            success: true,
            message: __('offer.retrieved_successfully'),
            data: result.data,
            pagination: result.pagination,
            filters: result.filters,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getOfferByIdHandler = async (req: Request, res: Response) => {
    try {
        // Get the ID directly from req.params
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: __('validation.id_required'),
            });
        }
        
        const numericId = Number(id);
        if (isNaN(numericId)) {
            return res.status(400).json({
                success: false,
                message: __('validation.invalid_id'),
            });
        }
        
        const offer = await getOfferById(numericId);
        
        res.status(200).json({
            success: true,
            message: __('offer.retrieved_successfully'),
            data: offer,
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const getOfferBySlugHandler = async (req: Request, res: Response) => {
    try {
        const slug = req.params.slug;
        
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: __('validation.slug_required'),
            });
        }
        
        const offer = await getOfferBySlug(slug);
        
        res.status(200).json({
            success: true,
            message: __('offer.retrieved_successfully'),
            data: offer,
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateOfferHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Use validated params data from middleware
        const params = (req as any).validatedParams || req.params;
        // Check if user can update this offer
        const existingOffer = await getOfferById(Number(params.id));
        
        // Check permissions: user can only update their own offers, or admin (roleId 1 or 2)
        if (req.user?.roleId !== 1 && req.user?.roleId !== 2 && existingOffer.ownerId !== req.user?.userId) {
            return res.status(403).json({
                success: false,
                message: __('offer.access_denied'),
            });
        }
        
        const offer = await updateOffer(Number(params.id), req.body);
        
        res.status(200).json({
            success: true,
            message: __('offer.updated_successfully'),
            data: offer,
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('already exists') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const activateOfferHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: __('validation.id_required'),
            });
        }
        
        // Check if user can activate this offer
        const existingOffer = await getOfferById(Number(id));
        
        // Check permissions: user can only activate their own offers, or admin (roleId 1 or 2)
        if (req.user?.roleId !== 1 && req.user?.roleId !== 2 && existingOffer.ownerId !== req.user?.userId) {
            return res.status(403).json({
                success: false,
                message: __('offer.access_denied'),
            });
        }
        
        const offer = await activateOffer(Number(id));
        
        res.status(200).json({
            success: true,
            message: __('offer.activated_successfully'),
            data: offer,
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

export const deactivateOfferHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: __('validation.id_required'),
            });
        }
        
        // Check if user can deactivate this offer
        const existingOffer = await getOfferById(Number(id));
        
        // Check permissions: user can only deactivate their own offers, or admin (roleId 1 or 2)
        if (req.user?.roleId !== 1 && req.user?.roleId !== 2 && existingOffer.ownerId !== req.user?.userId) {
            return res.status(403).json({
                success: false,
                message: __('offer.access_denied'),
            });
        }
        
        const offer = await deactivateOffer(Number(id));
        
        res.status(200).json({
            success: true,
            message: __('offer.deactivated_successfully'),
            data: offer,
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

export const deleteOfferHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Use validated params data from middleware
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: __('validation.id_required'),
            });
        }
        
        // Check if user can delete this offer
        const existingOffer = await getOfferById(Number(id));
        
        // Check permissions: user can only delete their own offers, or admin (roleId 1 or 2)
        if (req.user?.roleId !== 1 && req.user?.roleId !== 2 && existingOffer.ownerId !== req.user?.userId) {
            return res.status(403).json({
                success: false,
                message: __('offer.access_denied'),
            });
        }
        
        const result = await deleteOffer(Number(id));
        
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

export const getUserOffersHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const ownerId = req.user?.userId;
        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: __('auth.unauthorized'),
            });
        }
        
        // Use validated query data from middleware
        const queryData = (req as any).validatedQuery || req.query;
        const result = await getUserOffers(ownerId, queryData);
        
        res.status(200).json({
            success: true,
            message: __('offer.retrieved_successfully'),
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const filterOffersHandler = async (req: Request, res: Response) => {
    try {
        // Use parsed query data from middleware or fallback to original query
        const queryData = (req as any).parsedQuery || (req as any).validatedQuery || req.query;
        const result = await filterOffersAndGetPaymentServices(queryData);
        
        res.status(200).json({
            success: true,
            message: __('payment_service.retrieved_successfully'),
            data: result.data,
            pagination: result.pagination,
            filters: result.filters,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getOfferRangesHandler = async (req: Request, res: Response) => {
    try {
        const ranges = await getOfferRanges();
        
        res.status(200).json({
            success: true,
            message: __('offer.ranges_retrieved_successfully'),
            data: ranges,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
