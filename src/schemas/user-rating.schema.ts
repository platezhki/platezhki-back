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

export type CreateUserRatingBody = z.infer<typeof createUserRatingSchema>['body'];
export type UpdateUserRatingBody = z.infer<typeof updateUserRatingSchema>['body'];
