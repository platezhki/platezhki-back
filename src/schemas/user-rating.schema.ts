import { z } from "zod";

export const createUserRatingSchema = z.object({
    body: z.object({
        score: z.number().int().min(0, "Score must be between 0 and 5").max(5, "Score must be between 0 and 5"),
        comment: z.string().max(1000, "Comment too long").optional(),
    }),
});

export const deleteUserRatingSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9]+$/),
        ratingId: z.string().regex(/^[0-9]+$/),
    })
});

export const updateUserRatingSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9]+$/),
        ratingId: z.string().regex(/^[0-9]+$/),
    }),
    body: z.object({
        score: z.number().int().min(0, "Score must be between 0 and 5").max(5, "Score must be between 0 and 5").optional(),
        comment: z.string().max(1000, "Comment too long").optional(),
    })
});

export const getRatingsSchema = z.object({
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        score: z.union([z.string().transform(Number), z.number()]).optional(),
        minScore: z.union([z.string().transform(Number), z.number()]).optional(),
        maxScore: z.union([z.string().transform(Number), z.number()]).optional(),
        page: z.union([z.string().transform(Number), z.number()]).optional().default(1),
        limit: z.union([z.string().transform(Number), z.number()]).optional().default(10),
        sort_column: z.enum(['createdAt', 'score', 'repliesCount']).optional().default('createdAt'),
        order: z.enum(['asc', 'desc']).optional().default('desc'),
    }).optional(),
});

// Replies schemas
export const createUserRatingReplySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9]+$/),
    ratingId: z.string().regex(/^[0-9]+$/),
  }),
  body: z.object({
    comment: z.string().min(1, "Comment required").max(1000, "Comment too long"),
  })
});

export const getUserRatingRepliesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9]+$/),
    ratingId: z.string().regex(/^[0-9]+$/),
  }),
  query: z.object({
    page: z.union([z.string().transform(Number), z.number()]).optional().default(1),
    limit: z.union([z.string().transform(Number), z.number()]).optional().default(10),
  }).optional()
});

export const updateUserRatingReplySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9]+$/),
    ratingId: z.string().regex(/^[0-9]+$/),
    replyId: z.string().regex(/^[0-9]+$/),
  }),
  body: z.object({
    comment: z.string().min(1, "Comment required").max(1000, "Comment too long"),
  })
});

export const deleteUserRatingReplySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9]+$/),
    ratingId: z.string().regex(/^[0-9]+$/),
    replyId: z.string().regex(/^[0-9]+$/),
  })
});

export type CreateUserRatingBody = z.infer<typeof createUserRatingSchema>['body'];
export type UpdateUserRatingBody = z.infer<typeof updateUserRatingSchema>['body'];
export type GetRatingsQuery = z.infer<typeof getRatingsSchema>['query'];
export type CreateUserRatingReplyBody = z.infer<typeof createUserRatingReplySchema>['body'];
export type GetUserRatingRepliesQuery = z.infer<typeof getUserRatingRepliesSchema>['query'];
export type UpdateUserRatingReplyBody = z.infer<typeof updateUserRatingReplySchema>['body'];
