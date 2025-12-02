import { PrismaClient } from "../generated/prisma";
import { __ } from "../utils/i18n";

const prisma = new PrismaClient();

export const createReply = async (authorId: number, ratingId: number, comment: string) => {
  try {
    // Ensure rating exists
    const rating = await (prisma as any).userRating.findFirst({ where: { id: ratingId } });
    if (!rating) throw new Error(__('user_rating.rating_not_found'));

    // Ensure author (user) exists and is active
    const author = await (prisma as any).user.findFirst({ where: { id: authorId, isActive: true } });
    if (!author) throw new Error(__('auth.unauthorized'));

    const created = await (prisma as any).userRatingReply.create({
      data: { authorId, userRatingId: ratingId, comment }
    });

    // increment repliesCount on user rating
    await (prisma as any).userRating.update({ where: { id: ratingId }, data: { repliesCount: { increment: 1 } as any } as any });

    return created;
  } catch (err) {
    throw err;
  }
};

export const getRepliesForRating = async (ratingId: number, limit?: number, skip?: number) => {
  try {
    const findOptions: any = {
      where: { userRatingId: ratingId },
      include: { author: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'asc' }
    };

    if (limit !== undefined) findOptions.take = limit;
    if (skip !== undefined) findOptions.skip = skip;

    const replies = await (prisma as any).userRatingReply.findMany(findOptions);
    return replies;
  } catch (err) {
    throw err;
  }
};

export const updateReply = async (replyId: number, newComment: string) => {
  try {
    const reply = await (prisma as any).userRatingReply.findFirst({ where: { id: replyId } });
    if (!reply) throw new Error(__('user_rating.rating_not_found'));

    const updated = await (prisma as any).userRatingReply.update({ where: { id: replyId }, data: { comment: newComment } });
    return updated;
  } catch (err) {
    throw err;
  }
};

export const deleteReply = async (replyId: number) => {
  try {
    const reply = await (prisma as any).userRatingReply.findFirst({ where: { id: replyId } });
    if (!reply) throw new Error(__('user_rating.rating_not_found'));

    await (prisma as any).userRatingReply.delete({ where: { id: replyId } });

    // atomically decrement repliesCount if it's greater than zero to avoid negative values
    await (prisma as any).userRating.updateMany({
      where: { id: reply.userRatingId, repliesCount: { gt: 0 } },
      data: { repliesCount: { decrement: 1 } as any } as any
    });
    return true;
  } catch (err) {
    throw err;
  }
};

export const countRepliesForRating = async (ratingId: number) => {
  try {
    const cnt = await (prisma as any).userRatingReply.count({ where: { userRatingId: ratingId } });
    return cnt;
  } catch (err) {
    throw err;
  }
};
