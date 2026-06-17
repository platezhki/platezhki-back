import * as crypto from 'crypto';
import { Request, Response } from 'express';
import {
  createBroadcast,
  getBroadcast,
  getTelegramStatusForUser,
  listBroadcasts,
  processTelegramUpdate,
  refreshLinkToken,
  unlinkTelegram,
  updatePreferences,
} from '../services/telegram.service';
import { __ } from '../utils/i18n';

interface AuthenticatedRequest extends Request {
  user?: { userId: number; roleId: number };
}

const requireAuth = (req: AuthenticatedRequest, res: Response): number | null => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: __('auth.unauthorized') });
    return null;
  }
  return userId;
};

export const getMyTelegramStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req, res);
  if (userId == null) return;

  try {
    const status = await getTelegramStatusForUser(userId);
    res.status(200).json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const refreshMyTelegramLinkHandler = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req, res);
  if (userId == null) return;

  try {
    const link = await refreshLinkToken(userId);
    res.status(200).json({ success: true, data: link });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const unlinkMyTelegramHandler = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req, res);
  if (userId == null) return;

  try {
    const result = await unlinkTelegram(userId);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMyTelegramPreferencesHandler = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req, res);
  if (userId == null) return;

  try {
    const updated = await updatePreferences(userId, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Constant-time comparison of two strings that avoids leaking length/content
 * through timing. Returns false on any length mismatch instead of throwing.
 */
const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Public webhook endpoint hit by Telegram. Verified via the secret token
 * header that Telegram sends back on every request (configured at
 * setWebhook time). Fails closed: if the secret is not configured the
 * endpoint is disabled, and any request without a matching header is rejected.
 */
export const telegramWebhookHandler = async (req: Request, res: Response) => {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    // No secret configured — refuse to process unauthenticated updates.
    return res.status(503).json({ ok: false });
  }

  const provided = req.headers['x-telegram-bot-api-secret-token'];
  if (typeof provided !== 'string' || !safeEqual(provided, expectedSecret)) {
    return res.status(401).json({ ok: false });
  }

  try {
    await processTelegramUpdate(req.body);

    // Telegram retries 4xx/5xx forever — always respond 200.
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telegram] webhook error', err);
    res.status(200).json({ ok: true });
  }
};

// ----- Admin broadcast handlers -----

export const createBroadcastHandler = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req, res);
  if (userId == null) return;

  try {
    const broadcast = await createBroadcast(userId, req.body);
    res.status(201).json({ success: true, data: broadcast });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listBroadcastsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = (req as any).validatedQuery || req.query;
    const result = await listBroadcasts(query);
    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBroadcastHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const broadcast = await getBroadcast(id);
    res.status(200).json({ success: true, data: broadcast });
  } catch (err: any) {
    const isNotFound = err.message?.includes('not_found') || err.message?.includes('не найден');
    res.status(isNotFound ? 404 : 500).json({ success: false, message: err.message });
  }
};
