import { z } from 'zod';

export const addToFavoritesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid payment service ID')
  })
});

export const removeFromFavoritesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid payment service ID')
  })
});
