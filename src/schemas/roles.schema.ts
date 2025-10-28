import { z } from "zod";

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required"),
    }),
});

export const updateRoleSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    body: z.object({
        name: z.string().min(1, "Role name is required"),
    }),
});

// Direct body schemas (user-friendly)
export const createRoleBodySchema = z.object({
    name: z.string().min(1, "Role name is required"),
});

export const updateRoleBodySchema = z.object({
    name: z.string().min(1, "Role name is required"),
});

export type CreateRoleInput = z.infer<typeof createRoleBodySchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleBodySchema>;
