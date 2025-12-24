import { Request, Response } from "express";
import { __ } from "../utils/i18n";
import { createReply, getRepliesForRating, updateReply, deleteReply, countRepliesForRating } from "../services/user-rating-reply.service";

export const createReplyHandler = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    const authorId = auth?.userId;
    if (!authorId) {
      return res.status(401).json({ success: false, message: __('auth.unauthorized') });
    }

    const ratingId = Number(req.params.ratingId);
    const { comment } = req.body;

    const created = await createReply(authorId, ratingId, comment);
    res.status(201).json({ success: true, message: __('user_rating_reply.created'), data: created });
  } catch (err) {
    console.error('Create reply error:', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg === __('user_rating.rating_not_found')) {
      return res.status(404).json({ success: false, message: msg });
    }
    if (msg === __('general.forbidden')) {
      return res.status(403).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: __('user_rating_reply.create_failed') });
  }
};

export const getRepliesHandler = async (req: Request, res: Response) => {
  try {
    const ratingId = Number(req.params.ratingId);
    const vq = (req as any).validatedQuery as any | undefined;
    const query = vq ?? req.query;
    const page = query?.page ? Math.max(1, Number(query.page)) : 1;
    const limit = query?.limit ? Math.max(1, Number(query.limit)) : 10;
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      getRepliesForRating(ratingId, limit, skip),
      countRepliesForRating(ratingId)
    ]);

    const pages = limit > 0 ? Math.ceil(total / limit) : 1;

    res.status(200).json({
      success: true,
      message: __('user_rating_reply.replies_retrieved'),
      data: replies,
      pagination: { page, limit, total, pages }
    });
  } catch (err) {
    console.error('Get replies error:', err);
    res.status(500).json({ success: false, message: __('user_rating_reply.get_failed') });
  }
};

export const updateReplyHandler = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    const requesterId = auth?.userId;
    const requesterRoleId = auth?.roleId;
    if (!requesterId) {
      return res.status(401).json({ success: false, message: __('auth.unauthorized') });
    }

    const replyId = Number(req.params.replyId);
    const { comment } = req.body;

    // Check ownership
    const existing = await getRepliesForRating(Number(req.params.ratingId), undefined, undefined);
    const reply = (existing as any[]).find(r => r.id === replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: __('user_rating.rating_not_found') });
    }

    if (reply.authorId !== requesterId && requesterRoleId !== 1) {
      return res.status(403).json({ success: false, message: __('general.forbidden') });
    }

    const updated = await updateReply(replyId, comment);
    res.status(200).json({ success: true, message: __('user_rating_reply.updated'), data: updated });
  } catch (err) {
    console.error('Update reply error:', err);
    res.status(500).json({ success: false, message: __('user_rating_reply.create_failed') });
  }
};

export const deleteReplyHandler = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    const requesterId = auth?.userId;
    const requesterRoleId = auth?.roleId;
    if (!requesterId) {
      return res.status(401).json({ success: false, message: __('auth.unauthorized') });
    }

    const replyId = Number(req.params.replyId);

    const existing = await getRepliesForRating(Number(req.params.ratingId), undefined, undefined);
    const reply = (existing as any[]).find(r => r.id === replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: __('user_rating.rating_not_found') });
    }

    if (reply.authorId !== requesterId && requesterRoleId !== 1) {
      return res.status(403).json({ success: false, message: __('general.forbidden') });
    }

    await deleteReply(replyId);
    res.status(200).json({ success: true, message: __('user_rating_reply.deleted') });
  } catch (err) {
    console.error('Delete reply error:', err);
    res.status(500).json({ success: false, message: __('user_rating_reply.create_failed') });
  }
};
