import { z } from "zod";

export const loginBodySchema = z
  .object({
    login: z.string().min(2).optional(),
    username: z.string().min(2).optional(),
    password: z.string().min(8),
  })
  .refine((val) => !!(val.login || val.username), {
    message: "Either login or username is required",
    path: ["login"],
  });
export type LoginInput = z.infer<typeof loginBodySchema>;

export const loginSchema = z.object({
  body: loginBodySchema,
});

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(2),
    password: z.string().min(8),
    email: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
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

export const registerBodySchema = z.object({
  username: z.string().min(2),
  password: z.string().min(8),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const googleLoginBodySchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  ref: z.string().optional(),
});
export type GoogleLoginInput = z.infer<typeof googleLoginBodySchema>;

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;
export type LogoutInput = z.infer<typeof logoutBodySchema>;
