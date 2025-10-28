import { z } from "zod";

// Currency schemas
export const createCurrencySchema = z.object({
    body: z.object({
        name: z.string().min(1, "Currency name is required").max(10, "Currency name too long"),
    }),
});

export const updateCurrencySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    body: z.object({
        name: z.string().min(1, "Currency name is required").max(10, "Currency name too long"),
    }),
});

// Country schemas
export const createCountrySchema = z.object({
    body: z.object({
        name: z.string().min(1, "Country name is required").max(100, "Country name too long"),
        flagUrl: z.string().url("Flag URL must be a valid URL").optional(),
    }),
});

export const updateCountrySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    body: z.object({
        name: z.string().min(1, "Country name is required").max(100, "Country name too long"),
        flagUrl: z.string().url("Flag URL must be a valid URL").optional(),
    }),
});

// Direct body schemas (user-friendly)
export const createCurrencyBodySchema = z.object({
    name: z.string().min(1, "Currency name is required").max(10, "Currency name too long"),
});

export const updateCurrencyBodySchema = z.object({
    name: z.string().min(1, "Currency name is required").max(10, "Currency name too long"),
});

export const createCountryBodySchema = z.object({
    name: z.string().min(1, "Country name is required").max(100, "Country name too long"),
    flagUrl: z.string().url("Flag URL must be a valid URL").optional(),
});

export const updateCountryBodySchema = z.object({
    name: z.string().min(1, "Country name is required").max(100, "Country name too long"),
    flagUrl: z.string().url("Flag URL must be a valid URL").optional(),
});

// Type exports
export type CreateCurrencyInput = z.infer<typeof createCurrencyBodySchema>;
export type UpdateCurrencyInput = z.infer<typeof updateCurrencyBodySchema>;
export type CreateCountryInput = z.infer<typeof createCountryBodySchema>;
export type UpdateCountryInput = z.infer<typeof updateCountryBodySchema>;
