import { Request, Response } from "express";
import { __ } from "../utils/i18n";
import { createOrUpdateRating, getRatingsForUser, getAverageRating, deleteRating, updateRating } from "../services/user-rating.service";

export const createOrUpdateRatingHandler = async (req: Request, res: Response) => {
    try {
        const auth = (req as any).user;
        const raterId = auth?.userId;
        if (!raterId) {
            return res.status(401).json({ success: false, message: __('auth.unauthorized') });
        }

        const ratedUserId = Number(req.params.id);
        const { score, comment } = req.body;

        const result = await createOrUpdateRating(raterId, ratedUserId, score, comment);
        const rating = (result as any).rating ?? result;
        const isCreated = (result as any).isCreated === true;

        // return 201 if created, 200 if updated
        const status = isCreated ? 201 : 200;
        res.status(status).json({ success: true, message: __('user_rating.rating_saved'), data: rating });
    } catch (error) {
        console.error('Rating error:', error);
        if (error instanceof Error) {
            if (error.message === __('user.user_not_found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message === __('user_rating.cannot_rate_self')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            if (error.message === __('user_rating.invalid_score')) {
                return res.status(400).json({ success: false, message: error.message });
            }
        }
        res.status(500).json({ success: false, message: __('user_rating.rating_failed') });
    }
};

export const getRatingsHandler = async (req: Request, res: Response) => {
    try {
        const ratedUserId = Number(req.params.id);

        // Prefer validated query from middleware when available
        const vq = (req as any).validatedQuery as any | undefined;
        const query = vq ?? req.query;

        const response = await getRatingsForUser(ratedUserId, query);
        res.status(200).json(response);
    } catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({ success: false, message: __('user_rating.get_ratings_failed') });
    }
};

export const getAverageRatingHandler = async (req: Request, res: Response) => {
    try {
        const ratedUserId = Number(req.params.id);
        const avg = await getAverageRating(ratedUserId);
        res.status(200).json({ success: true, message: __('user_rating.average_retrieved'), data: avg });
    } catch (error) {
        console.error('Get avg error:', error);
        res.status(500).json({ success: false, message: __('user_rating.get_average_failed') });
    }
};

export const deleteRatingHandler = async (req: Request, res: Response) => {
    try {
        const auth = (req as any).user;
        const requesterId = auth?.userId;
        const requesterRoleId = auth?.roleId;
        if (!requesterId) {
            return res.status(401).json({ success: false, message: __('auth.unauthorized') });
        }

        const ratingId = Number(req.params.ratingId);
        await deleteRating(ratingId, requesterId, requesterRoleId);
        res.status(200).json({ success: true, message: __('user_rating.rating_deleted') });
    } catch (error) {
        console.error('Delete rating error:', error);
        if (error instanceof Error && error.message === __('user_rating.rating_not_found')) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error instanceof Error && error.message === __('auth.unauthorized')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: __('user_rating.delete_failed') });
    }
};

export const updateRatingHandler = async (req: Request, res: Response) => {
    try {
        const auth = (req as any).user;
        const requesterId = auth?.userId;
        const requesterRoleId = auth?.roleId;
        if (!requesterId) {
            return res.status(401).json({ success: false, message: __('auth.unauthorized') });
        }

        const ratedUserId = Number(req.params.id);
        const ratingId = Number(req.params.ratingId);
        const { score, comment } = req.body;

        const updated = await updateRating(ratingId, requesterId, requesterRoleId, ratedUserId, { score, comment });
        res.status(200).json({ success: true, message: __('user_rating.rating_saved'), data: updated });
    } catch (error) {
        console.error('Update rating error:', error);
        if (error instanceof Error) {
            if (error.message === __('user_rating.rating_not_found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message === __('auth.unauthorized')) {
                return res.status(403).json({ success: false, message: error.message });
            }
            if (error.message === __('user_rating.invalid_score')) {
                return res.status(400).json({ success: false, message: error.message });
            }
        }
        res.status(500).json({ success: false, message: __('user_rating.rating_failed') });
    }
};
