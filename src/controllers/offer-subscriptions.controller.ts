import { Request, Response } from 'express';
import {
  subscribeToOffer,
  unsubscribeFromOffer,
  isSubscribedToOffer,
  getUserSubscribedOffers
} from '../services/offer-subscriptions.service';
import { __ } from '../utils/i18n';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    roleId: number;
  };
}

export const subscribeToOfferHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const offerId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, message: __('auth.unauthorized') });
    }

    const subscription = await subscribeToOffer(userId, offerId);

    res.status(201).json({
      success: true,
      message: __('offer_subscriptions.added_successfully'),
      data: subscription
    });
  } catch (error: any) {
    const statusCode = error.message.includes('already_subscribed') ? 400 :
                       error.message.includes('not_found') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const unsubscribeFromOfferHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const offerId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, message: __('auth.unauthorized') });
    }

    const result = await unsubscribeFromOffer(userId, offerId);

    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    const statusCode = error.message.includes('not_found') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const isSubscribedToOfferHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const offerId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, message: __('auth.unauthorized') });
    }

    const result = await isSubscribedToOffer(userId, offerId);

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserSubscribedOffersHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: __('auth.unauthorized') });
    }

    const queryData = (req as any).parsedQuery || (req as any).validatedQuery || req.query;
    const result = await getUserSubscribedOffers(userId, queryData);

    res.status(200).json({
      success: true,
      message: __('offer_subscriptions.retrieved_successfully'),
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
