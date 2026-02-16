import { Request, Response } from 'express';
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  isFavorite
} from '../services/favorites.service';
import { __ } from '../utils/i18n';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    roleId: number;
  };
}

/**
 * Add payment service to favorites
 */
export const addToFavoritesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const paymentServiceId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: __('auth.unauthorized')
      });
    }

    const favorite = await addToFavorites(userId, paymentServiceId);

    res.status(201).json({
      success: true,
      message: __('favorites.added_successfully'),
      data: favorite
    });
  } catch (error: any) {
    const statusCode = error.message.includes('already_added') ? 400 :
                       error.message.includes('not_found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remove payment service from favorites
 */
export const removeFromFavoritesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const paymentServiceId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: __('auth.unauthorized')
      });
    }

    const result = await removeFromFavorites(userId, paymentServiceId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not_found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user's favorites with filtering
 */
export const getUserFavoritesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: __('auth.unauthorized')
      });
    }

    const queryData = (req as any).parsedQuery || (req as any).validatedQuery || req.query;
    const result = await getUserFavorites(userId, queryData);

    res.status(200).json({
      success: true,
      message: __('favorites.retrieved_successfully'),
      data: result.data,
      pagination: result.pagination,
      totalOffers: result.totalOffers,
      filters: result.filters
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
