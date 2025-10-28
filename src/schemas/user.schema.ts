import { z } from "zod";

export const updateUserSchema = z.object({
    body: z.object({
        username: z.string().min(3, "Username must be at least 3 characters").optional(),
        email: z.string().email("Invalid email format").optional(),
        roleId: z.number().int().positive("Role ID must be a positive integer").optional(),
    }),
});

export const createUserSchema = z.object({
    body: z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        roleId: z.number().int().positive("Role ID must be a positive integer").default(3),
    }),
});

// Direct body schemas (user-friendly)
export const updateUserBodySchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").optional(),
    email: z.string().email("Invalid email format").optional(),
    roleId: z.number().int().positive("Role ID must be a positive integer").optional(),
});

export const createUserBodySchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    roleId: z.number().int().positive("Role ID must be a positive integer").default(3),
});

export type UpdateUserInput = z.infer<typeof updateUserBodySchema>;
export type CreateUserInput = z.infer<typeof createUserBodySchema>;