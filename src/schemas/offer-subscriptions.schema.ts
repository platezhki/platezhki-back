import { z } from 'zod';

export const subscribeToOfferSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid offer ID')
  })
});

export const unsubscribeFromOfferSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid offer ID')
  })
});
