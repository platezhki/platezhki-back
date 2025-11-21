import { PrismaClient } from "../generated/prisma";
import { __ } from "../utils/i18n";

const prisma = new PrismaClient();

export const createOrUpdateRating = async (raterId: number, ratedUserId: number, score: number, comment?: string) => {
    try {
        // Prevent rating yourself
        if (raterId === ratedUserId) {
            throw new Error(__('user_rating.cannot_rate_self'));
        }

        // Ensure rated user exists and is active
        const ratedUser = await prisma.user.findFirst({ where: { id: ratedUserId, isActive: true } });
        if (!ratedUser) {
            throw new Error(__('user.user_not_found'));
        }

        // Validate score server-side as a safety net (0-5)
        if (typeof score !== 'number' || score < 0 || score > 5) {
            throw new Error(__('user_rating.invalid_score') || 'Invalid score');
        }

        // Always create a new rating record — allow multiple ratings from the same rater to the same user
        const created = await (prisma as any).userRating.create({
            data: { raterId, ratedUserId, score, comment }
        });

        // Update denormalized aggregates on User
        await updateUserRatingAggregate(ratedUserId);

        return created;
    } catch (error) {
        throw error;
    }
};

export const getRatingsForUser = async (ratedUserId: number) => {
    try {
        const ratings = await (prisma as any).userRating.findMany({
            where: { ratedUserId },
            include: { rater: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return ratings;
    } catch (error) {
        throw error;
    }
};

export const getAverageRating = async (ratedUserId: number) => {
    try {
        const result = await (prisma as any).userRating.aggregate({
            where: { ratedUserId },
            _avg: { score: true },
            _count: { _all: true }
        });

        return { average: result._avg.score ?? 0, count: result._count._all };
    } catch (error) {
        throw error;
    }
};

export const deleteRating = async (ratingId: number, requesterId: number, requesterRoleId?: number) => {
    try {
        const rating = await (prisma as any).userRating.findFirst({ where: { id: ratingId } });
        if (!rating) {
            throw new Error(__('user_rating.rating_not_found'));
        }

        // Only rater or admin (roleId 1) can delete
        if (rating.raterId !== requesterId && requesterRoleId !== 1) {
            throw new Error(__('auth.unauthorized'));
        }

        const deleted = await (prisma as any).userRating.delete({ where: { id: ratingId } });

        // Update aggregates for the rated user
        await updateUserRatingAggregate(deleted.ratedUserId);

        return true;
    } catch (error) {
        throw error;
    }
};

export const updateRating = async (
    ratingId: number,
    requesterId: number,
    requesterRoleId: number | undefined,
    ratedUserId: number,
    data: { score?: number; comment?: string }
) => {
    try {
        const rating = await (prisma as any).userRating.findFirst({ where: { id: ratingId } });
        if (!rating) {
            throw new Error(__('user_rating.rating_not_found'));
        }

        // Ensure the rating belongs to the provided rated user id
        if (rating.ratedUserId !== ratedUserId) {
            throw new Error(__('user_rating.rating_not_found'));
        }

        // Only rater or admin (roleId 1) can update
        if (rating.raterId !== requesterId && requesterRoleId !== 1) {
            throw new Error(__('auth.unauthorized'));
        }

        // Validate score if provided
        if (data.score !== undefined) {
            if (typeof data.score !== 'number' || data.score < 0 || data.score > 5) {
                throw new Error(__('user_rating.invalid_score') || 'Invalid score');
            }
        }

        const updateData: any = {};
        if (data.score !== undefined) updateData.score = data.score;
        if (data.comment !== undefined) updateData.comment = data.comment;

        const updated = await (prisma as any).userRating.update({ where: { id: ratingId }, data: updateData });

        // Update aggregates for the rated user
        await updateUserRatingAggregate(updated.ratedUserId);
        return updated;
    } catch (error) {
        throw error;
    }
};

// Helper: recompute average and count and persist to User
const updateUserRatingAggregate = async (ratedUserId: number) => {
    const result = await (prisma as any).userRating.aggregate({
        where: { ratedUserId },
        _avg: { score: true },
        _count: { _all: true }
    });

    const average = result._avg.score ?? 0;
    const count = result._count._all ?? 0;

    await prisma.user.update({ where: { id: ratedUserId }, data: { averageRating: average, ratingsCount: count } });
};
