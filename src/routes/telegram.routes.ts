import { Router } from 'express';
import {
  createBroadcastHandler,
  getBroadcastHandler,
  getBroadcastStatsHandler,
  getMyTelegramStatusHandler,
  listBroadcastsHandler,
  refreshMyTelegramLinkHandler,
  telegramWebhookHandler,
  unlinkMyTelegramHandler,
  updateMyTelegramPreferencesHandler,
} from '../controllers/telegram.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdminOrModerator } from '../middlewares/authorize-roles';
import { validateBody, validateQuery } from '../middlewares/validate';
import {
  createBroadcastSchema,
  listBroadcastsQuerySchema,
  updateTelegramPreferencesSchema,
} from '../schemas/telegram.schema';

// Public router (no auth) — Telegram webhook is checked via secret header.
export const publicTelegramRouter = Router();
publicTelegramRouter.post('/telegram/webhook', telegramWebhookHandler);

// Authenticated router for users + admins.
const router = Router();

router.get('/me/telegram', authenticateToken, getMyTelegramStatusHandler);
router.post('/me/telegram/link', authenticateToken, refreshMyTelegramLinkHandler);
router.delete('/me/telegram', authenticateToken, unlinkMyTelegramHandler);
router.patch(
  '/me/telegram/preferences',
  authenticateToken,
  validateBody(updateTelegramPreferencesSchema),
  updateMyTelegramPreferencesHandler,
);

// Admin endpoints
router.post(
  '/admin/telegram/broadcasts',
  authenticateToken,
  requireAdminOrModerator(),
  validateBody(createBroadcastSchema),
  createBroadcastHandler,
);
router.get(
  '/admin/telegram/broadcasts',
  authenticateToken,
  requireAdminOrModerator(),
  validateQuery(listBroadcastsQuerySchema),
  listBroadcastsHandler,
);
router.get(
  '/admin/telegram/broadcasts/stats',
  authenticateToken,
  requireAdminOrModerator(),
  getBroadcastStatsHandler,
);
router.get(
  '/admin/telegram/broadcasts/:id',
  authenticateToken,
  requireAdminOrModerator(),
  getBroadcastHandler,
);

export default router;
