import { z } from "zod";

export const createSettingSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    value: z.string().min(1, "Value is required"),
    type: z.string().min(1, "Type is required"),
    updatedBy: z.number().min(1, "Updated by user ID is required"),
  }),
});

export const getSettingsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
});

export const getSettingSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID is required"),
  }),
});

export const getSettingByNameSchema = z.object({
  params: z.object({
    name: z.string().min(1, "Name is required"),
  }),
});

export const updateSettingSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID is required"),
  }),
  body: z.object({
    value: z.string().min(1, "Value is required"),
    type: z.string().optional(),
    updatedBy: z.number().min(1, "Updated by user ID is required"),
  }),
});

// Direct body schemas (user-friendly)
export const createSettingBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required"),
  type: z.string().min(1, "Type is required"),
  updatedBy: z.number().min(1, "Updated by user ID is required"),
});

export const updateSettingBodySchema = z.object({
  value: z.string().min(1, "Value is required"),
  type: z.string().optional(),
  updatedBy: z.number().min(1, "Updated by user ID is required"),
});