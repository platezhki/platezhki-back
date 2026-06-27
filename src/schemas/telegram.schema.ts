import { z } from 'zod';

export const updateTelegramPreferencesSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  notifyAllOffers: z.boolean().optional(),
  notifyFavorites: z.boolean().optional(),
  notifyOfferUpdates: z.boolean().optional(),
});

export const createBroadcastSchema = z.object({
  text: z.string().min(1).max(4000),
  roleIds: z.array(z.number().int().positive()).optional(),
  onlyWithBot: z.boolean().optional(),
});

export const broadcastIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

export const broadcastStatusFilterValues = [
  'pending',
  'sending',
  'completed',
  'failed',
  'sent',
  'partial',
  'not_sent',
] as const;

export const listBroadcastsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).max(255).optional(),
  status: z.enum(broadcastStatusFilterValues).optional(),
});
