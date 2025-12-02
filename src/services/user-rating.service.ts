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

        // If a rating from this rater to this user already exists, update it; otherwise create new
        const existing = await (prisma as any).userRating.findFirst({ where: { raterId, ratedUserId } });

        if (existing) {
            const updated = await (prisma as any).userRating.update({
                where: { id: existing.id },
                data: { score, comment }
            });

            // Update denormalized aggregates on User
            await updateUserRatingAggregate(ratedUserId);

            return { rating: updated, isCreated: false };
        }

        const created = await (prisma as any).userRating.create({
            data: { raterId, ratedUserId, score, comment }
        });

        // Update denormalized aggregates on User
        await updateUserRatingAggregate(ratedUserId);

        return { rating: created, isCreated: true };
    } catch (error) {
        throw error;
    }
};

export const getRatingsForUser = async (
    ratedUserId: number,
    filters?: {
        page?: number;
        startDate?: string | Date;
        endDate?: string | Date;
        score?: number;
        minScore?: number;
        maxScore?: number;
        limit?: number;
        skip?: number;
        sort_column?: 'createdAt' | 'score';
        order?: 'asc' | 'desc';
    }
) => {
    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        // Build where clause dynamically based on provided filters
        const where: any = { ratedUserId };

        if (filters) {
            // Date range
            if (filters.startDate || filters.endDate) {
                where.createdAt = {};
                if (filters.startDate) {
                    const d = typeof filters.startDate === 'string' ? new Date(filters.startDate) : filters.startDate;
                    if (!isNaN(d.getTime())) where.createdAt.gte = d;
                }
                if (filters.endDate) {
                    const d = typeof filters.endDate === 'string' ? new Date(filters.endDate) : filters.endDate;
                    if (!isNaN(d.getTime())) where.createdAt.lte = d;
                }
            }

            // Score filters: exact or range
            if (filters.score !== undefined) {
                where.score = filters.score;
            } else if (filters.minScore !== undefined || filters.maxScore !== undefined) {
                where.score = {};
                if (filters.minScore !== undefined) where.score.gte = filters.minScore;
                if (filters.maxScore !== undefined) where.score.lte = filters.maxScore;
            }
        }

        const include = { rater: { select: { id: true, username: true, role: true, ratingsCount: true } } };

        const orderDir = filters?.order === 'asc' ? 'asc' : 'desc';

        // choose sort column (allow repliesCount)
        const sortColumn = filters?.sort_column === 'createdAt' ? 'createdAt' : (filters?.sort_column === 'score' ? 'score' : (filters?.sort_column === 'repliesCount' ? 'repliesCount' : 'id'));

        const data = await (prisma as any).userRating.findMany({
            where,
            skip,
            take: limit,
            include,
            orderBy: { [sortColumn]: orderDir }
        });

        const dataWithReplies = data; // repliesCount is stored in DB now

        const total = await prisma.userRating.count({ where });
        const pages = Math.ceil(total / limit);

        return {
            data: dataWithReplies,
            pagination: {
                page,
                limit,
                total,
                pages
            },
        };
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
