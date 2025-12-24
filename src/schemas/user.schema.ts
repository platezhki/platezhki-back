import { z } from "zod";

export const updateUserSchema = z.object({
    body: z.object({
        username: z.string().min(3, "Username must be at least 3 characters").optional(),
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
    }).refine((val) => !!(val.username || val.password), {
        message: "Either username or password is required",
        path: ["username"],
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
export const updateUserBodySchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
  })
  .refine((val) => !!(val.username || val.password), {
    message: "Either username or password is required",
    path: ["username"],
  });

export const createUserBodySchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    roleId: z.number().int().positive("Role ID must be a positive integer").default(3),
});

export const getUsersAdminSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    q: z.string().min(1).optional(),
    // equality filters
    id: z.coerce.number().int().optional(),
    ids: z.string().min(1).optional(), // space-separated IDs e.g. "12 34 56"
    roleId: z.coerce.number().int().optional(),
    ownerId: z.coerce.number().int().optional(),
    isActive: z.coerce.boolean().optional(),
    emailVerified: z.coerce.boolean().optional(),
    username: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
    // range filters
    averageRatingMin: z.coerce.number().optional(),
    averageRatingMax: z.coerce.number().optional(),
    ratingsCountMin: z.coerce.number().int().optional(),
    ratingsCountMax: z.coerce.number().int().optional(),
    createdAtFrom: z.coerce.date().optional(),
    createdAtTo: z.coerce.date().optional(),
    updatedAtFrom: z.coerce.date().optional(),
    updatedAtTo: z.coerce.date().optional(),
    lastActivityFrom: z.coerce.date().optional(),
    lastActivityTo: z.coerce.date().optional(),
    // sorting
    sort_column: z.enum([
      'id','username','email','roleId','averageRating','ratingsCount','createdAt','updatedAt','lastActivity','ownerId','isActive','emailVerified'
    ]).default('createdAt').optional(),
    order: z.enum(['asc','desc']).default('desc').optional(),
  })
});

export const updateUserAdminParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const updateUserAdminBodySchema = z.object({
  username: z.string().min(3).optional(),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
    .optional(),
  password: z.string().min(6).optional(),
  roleId: z.coerce.number().int().optional(),
  ownerId: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
  emailVerified: z.coerce.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
  path: ["username"],
});

export const updateUserAdminSchema = z.object({
  params: updateUserAdminParamsSchema,
  body: updateUserAdminBodySchema,
});

export type UpdateUserInput = z.infer<typeof updateUserBodySchema>;
export type CreateUserInput = z.infer<typeof createUserBodySchema>;
export type GetUsersAdminQuery = z.infer<typeof getUsersAdminSchema>['query'];
export type UpdateUserAdminBody = z.infer<typeof updateUserAdminBodySchema>;
export type UpdateUserAdminParams = z.infer<typeof updateUserAdminParamsSchema>;
