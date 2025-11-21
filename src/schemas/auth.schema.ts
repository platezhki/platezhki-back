import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(2),
    password: z.string().min(8),
  }),
});

// Direct body schemas (user-friendly)
export const loginBodySchema = z.object({
  username: z.string().min(2),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginBodySchema>;

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(2),
    password: z.string().min(8),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
    roleId: z.number().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// Direct body schemas (user-friendly)
export const registerBodySchema = z.object({
  username: z.string().min(2),
  password: z.string().min(8),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;
export type LogoutInput = z.infer<typeof logoutBodySchema>;
