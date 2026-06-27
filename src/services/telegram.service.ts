import * as crypto from 'crypto';
import { Prisma, PrismaClient } from '../generated/prisma';
import { __ } from '../utils/i18n';
import {
  buildStartLink,
  getBotUsername,
  isTelegramConfigured,
  sendMessage,
} from './telegram-client.service';

const prisma = new PrismaClient();

const LINK_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PUBLIC_SITE_BASE = process.env.PUBLIC_SITE_URL || 'https://platezhki.com';

const escapeHtml = (input: string | null | undefined): string => {
  if (input == null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Build the welcome/connection link payload for a user.
 *
 * Reuses a non-expired token if one already exists; otherwise issues a new
 * one. Token is one-time and tied to a user; admin endpoints can re-link
 * after unbinding.
 */
export const ensureLinkToken = async (userId: number) => {
  const now = new Date();

  const existing = await prisma.telegramLinkToken.findFirst({
    where: { userId, usedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) return existing;

  const token = crypto.randomBytes(24).toString('hex');
  return prisma.telegramLinkToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(now.getTime() + LINK_TOKEN_TTL_MS),
    },
  });
};

export const getTelegramStatusForUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telegramChatId: true,
      telegramUsername: true,
      telegramLinkedAt: true,
      notificationsEnabled: true,
      notifyAllOffers: true,
      notifyFavorites: true,
      notifyOfferUpdates: true,
    },
  });

  if (!user) throw new Error(__('user.user_not_found'));

  const isConnected = Boolean(user.telegramChatId);

  const base = {
    isConnected,
    botUsername: isTelegramConfigured() ? getBotUsername() : null,
    preferences: {
      notificationsEnabled: user.notificationsEnabled,
      notifyAllOffers: user.notifyAllOffers,
      notifyFavorites: user.notifyFavorites,
      notifyOfferUpdates: user.notifyOfferUpdates,
    },
  } as Record<string, any>;

  if (isConnected) {
    base.telegram = {
      username: user.telegramUsername,
      linkedAt: user.telegramLinkedAt,
    };
    return base;
  }

  if (!isTelegramConfigured()) {
    base.startLink = null;
    base.deepLink = null;
    base.qrCodeData = null;
    base.expiresAt = null;
    return base;
  }

  const tokenRow = await ensureLinkToken(userId);
  const startLink = buildStartLink(tokenRow.token);

  base.startLink = startLink;
  base.deepLink = startLink;
  base.qrCodeData = startLink; // front-end renders the QR from this string
  base.expiresAt = tokenRow.expiresAt;
  return base;
};

export const refreshLinkToken = async (userId: number) => {
  // Invalidate any pending tokens first so the previous link can no longer be used.
  await prisma.telegramLinkToken.deleteMany({
    where: { userId, usedAt: null },
  });

  const tokenRow = await ensureLinkToken(userId);
  return {
    startLink: buildStartLink(tokenRow.token),
    expiresAt: tokenRow.expiresAt,
  };
};

export const unlinkTelegram = async (userId: number) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramChatId: null,
      telegramUsername: null,
      telegramLinkedAt: null,
    },
  });
  await prisma.telegramLinkToken.deleteMany({ where: { userId } });
  return { unlinked: true };
};

export const updatePreferences = async (
  userId: number,
  patch: {
    notificationsEnabled?: boolean;
    notifyAllOffers?: boolean;
    notifyFavorites?: boolean;
    notifyOfferUpdates?: boolean;
  }
) => {
  const data: Record<string, any> = {};
  if (typeof patch.notificationsEnabled === 'boolean') data.notificationsEnabled = patch.notificationsEnabled;
  if (typeof patch.notifyAllOffers === 'boolean') data.notifyAllOffers = patch.notifyAllOffers;
  if (typeof patch.notifyFavorites === 'boolean') data.notifyFavorites = patch.notifyFavorites;
  if (typeof patch.notifyOfferUpdates === 'boolean') data.notifyOfferUpdates = patch.notifyOfferUpdates;

  const select = {
    notificationsEnabled: true,
    notifyAllOffers: true,
    notifyFavorites: true,
    notifyOfferUpdates: true,
  };

  if (Object.keys(data).length === 0) {
    // Nothing to update; just return current values
    return prisma.user.findUnique({ where: { id: userId }, select });
  }

  return prisma.user.update({ where: { id: userId }, data, select });
};

/**
 * Handle a `/start <token>` payload coming from the bot. Consumes the link
 * token, attaches the chat id to the user, and returns the linked user.
 */
export const consumeLinkToken = async (
  token: string,
  chatId: string,
  telegramUsername: string | null,
) => {
  const now = new Date();
  const row = await prisma.telegramLinkToken.findUnique({ where: { token } });
  if (!row || row.usedAt) return null;
  if (row.expiresAt < now) return null;

  const user = await prisma.user.findUnique({
    where: { id: row.userId },
    select: { id: true, isActive: true, username: true, telegramChatId: true },
  });
  if (!user || !user.isActive) return null;

  // If another user already linked this chat id, un-link them first so the new
  // user can take over. Telegram chat ids are unique per user.
  await prisma.user.updateMany({
    where: { telegramChatId: chatId, NOT: { id: user.id } },
    data: { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: chatId,
      telegramUsername: telegramUsername ?? undefined,
      telegramLinkedAt: now,
    },
  });

  await prisma.telegramLinkToken.update({
    where: { id: row.id },
    data: { usedAt: now },
  });

  return { userId: user.id, username: user.username };
};

/**
 * Handle a single Telegram Update object. Shared by the webhook controller and
 * the long-polling dev runner so both behave identically. Currently processes
 * `/start <token>` deep links used to connect a chat to a user account.
 */
export const processTelegramUpdate = async (update: any): Promise<void> => {
  const message = update?.message;
  const text: string = message?.text || '';
  const chatId = message?.chat?.id;
  const tgUsername: string | null = message?.from?.username || null;

  if (chatId && /^\/start\b/.test(text)) {
    const tokenPart = text.replace(/^\/start\s*/, '').trim();
    if (tokenPart) {
      const linked = await consumeLinkToken(tokenPart, String(chatId), tgUsername);
      await sendMessage({
        chatId,
        text: linked
          ? `Аккаунт <b>${escapeHtml(linked.username)}</b> успешно подключён. Вы будете получать уведомления о новых офферах.`
          : 'Ссылка недействительна или уже использована. Сгенерируйте новую в личном кабинете.',
        parseMode: 'HTML',
      });
    } else {
      await sendMessage({
        chatId,
        text: 'Подключите бот через ваш личный кабинет на platezhki.com.',
      });
    }
  }
};

const formatLimit = (min?: number | null, max?: number | null): string => {
  const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);
  if ((min == null || min === 0) && (max == null || max === 0)) return '';
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `от ${fmt(min)}`;
  if (max != null) return `до ${fmt(max)}`;
  return '';
};

const yesNo = (value: boolean | null | undefined): string => (value ? 'Да' : 'Нет');

/**
 * Build the new-offer notification text. Lines for unavailable values are
 * omitted entirely (per spec: "only if available").
 */
export const formatNewOfferMessage = (offer: any): { text: string; url: string | null } => {
  const lines: string[] = ['<b>Добавлен новый оффер</b>', ''];

  const paymentService = offer?.paymentServices?.[0]?.paymentService;
  const paymentServiceName = paymentService?.name;
  const paymentServiceSlug = paymentService?.slug;
  const url = paymentServiceSlug
    ? `${PUBLIC_SITE_BASE.replace(/\/$/, '')}/payment-method/${paymentServiceSlug}`
    : null;

  if (paymentServiceName) lines.push(`Платежка: ${escapeHtml(paymentServiceName)}`);
  if (offer?.name) lines.push(`Название оффера: ${escapeHtml(offer.name)}`);

  const countryNames = (offer?.countries || [])
    .map((c: any) => c?.country?.name || c?.name)
    .filter(Boolean);
  if (countryNames.length) lines.push(`Гео: ${escapeHtml(countryNames.join(', '))}`);

  const methodNames = (offer?.paymentMethods || [])
    .map((pm: any) => pm?.paymentMethod?.name || pm?.name)
    .filter(Boolean);
  if (methodNames.length) lines.push(`Метод: ${escapeHtml(methodNames.join(', '))}`);

  if (typeof offer?.payInFee === 'number' && offer.payInFee > 0) {
    lines.push(`Pay-in (Fee): ${offer.payInFee}%`);
  }
  if (typeof offer?.payOutFee === 'number' && offer.payOutFee > 0) {
    lines.push(`Pay-out (Fee): ${offer.payOutFee}%`);
  }

  const payInLimits = formatLimit(offer?.payInMinLimit, offer?.payInMaxLimit);
  if (payInLimits) lines.push(`Pay-in (Limits): ${payInLimits}`);

  const payOutLimits = formatLimit(offer?.payOutMinLimit, offer?.payOutMaxLimit);
  if (payOutLimits) lines.push(`Pay-out (Limits): ${payOutLimits}`);

  if (typeof offer?.support247 === 'boolean') {
    lines.push(`Поддержка 24/7: ${yesNo(offer.support247)}`);
  }
  if (typeof offer?.legalPerson === 'boolean') {
    lines.push(`Юридическое лицо: ${yesNo(offer.legalPerson)}`);
  }
  if (typeof offer?.automatics === 'boolean') {
    lines.push(`Автоматика: ${yesNo(offer.automatics)}`);
  }

  return { text: lines.join('\n'), url };
};

/**
 * Select users that should receive a new-offer notification for the given
 * offer. Combines "all offers" subscribers with users who favorited any of
 * the offer's payment services.
 */
const selectOfferRecipients = async (offer: any): Promise<{ id: number; telegramChatId: string }[]> => {
  const paymentServiceIds = (offer?.paymentServices || [])
    .map((ps: any) => ps?.paymentService?.id ?? ps?.paymentServiceId)
    .filter((id: any) => typeof id === 'number');

  const conditions: any[] = [{ notifyAllOffers: true }];
  if (paymentServiceIds.length) {
    conditions.push({
      notifyFavorites: true,
      favorites: { some: { paymentServiceId: { in: paymentServiceIds } } },
    });
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      notificationsEnabled: true,
      telegramChatId: { not: null },
      OR: conditions,
    },
    select: { id: true, telegramChatId: true },
  });

  return users.filter((u): u is { id: number; telegramChatId: string } => !!u.telegramChatId);
};

/**
 * Send the same message to a list of linked recipients sequentially.
 * Telegram limits bulk sends to ~30 msg/sec, so a small delay is inserted
 * between calls. Users who blocked the bot (403) are detached so we stop
 * retrying on every event. Failures are logged but never thrown.
 */
const sendToRecipients = async (
  recipients: { id: number; telegramChatId: string }[],
  text: string,
  url: string | null,
  logLabel: string,
): Promise<void> => {
  const replyMarkup = url
    ? { inline_keyboard: [[{ text: 'Перейти на сайт', url }]] }
    : undefined;

  for (const user of recipients) {
    const result = await sendMessage({
      chatId: user.telegramChatId,
      text,
      parseMode: 'HTML',
      replyMarkup,
    });

    if (!result.ok) {
      console.error(`[telegram] failed to send ${logLabel}`, {
        userId: user.id,
        status: result.status,
        description: result.description,
        errorCode: result.errorCode,
      });

      // 403 = user blocked the bot or deleted the chat. Detach so we don't
      // keep retrying on every event.
      if (result.errorCode === 403) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null },
          })
          .catch(() => undefined);
      }
    }

    await new Promise((r) => setTimeout(r, 40));
  }
};

/**
 * Fire-and-forget dispatch of the new-offer notification. Returns
 * immediately; failures are logged but never throw to the caller.
 */
export const dispatchNewOfferNotifications = (offer: any): void => {
  if (!isTelegramConfigured()) return;
  if (!offer || offer.isActive === false) return;

  // Don't await — caller is the offer-create flow and shouldn't be blocked.
  void (async () => {
    try {
      const recipients = await selectOfferRecipients(offer);
      if (!recipients.length) return;

      const { text, url } = formatNewOfferMessage(offer);
      await sendToRecipients(recipients, text, url, 'offer notification');
    } catch (err) {
      console.error('[telegram] dispatch error', err);
    }
  })();
};

// ----- Offer update notifications (favorited payment services) -----

const OFFER_UPDATE_FIELDS: { key: string; label: string; type: 'number' | 'percent' | 'bool' | 'text' }[] = [
  { key: 'name', label: 'Название оффера', type: 'text' },
  { key: 'payInFee', label: 'Pay-in (Fee)', type: 'percent' },
  { key: 'payOutFee', label: 'Pay-out (Fee)', type: 'percent' },
  { key: 'payInMinLimit', label: 'Pay-in (Min)', type: 'number' },
  { key: 'payInMaxLimit', label: 'Pay-in (Max)', type: 'number' },
  { key: 'payOutMinLimit', label: 'Pay-out (Min)', type: 'number' },
  { key: 'payOutMaxLimit', label: 'Pay-out (Max)', type: 'number' },
  { key: 'support247', label: 'Поддержка 24/7', type: 'bool' },
  { key: 'legalPerson', label: 'Юридическое лицо', type: 'bool' },
  { key: 'automatics', label: 'Автоматика', type: 'bool' },
];

/**
 * Compare the previous and updated offer and return the list of monitored
 * fields whose value changed. Used to decide whether an update is worth
 * notifying about and to render a concise "what changed" summary.
 */
export const diffOfferFields = (before: any, after: any): string[] => {
  const changed: string[] = [];
  for (const { key } of OFFER_UPDATE_FIELDS) {
    const a = before?.[key];
    const b = after?.[key];
    if (a == null && b == null) continue;
    if (String(a) !== String(b)) changed.push(key);
  }
  return changed;
};

/**
 * Build the offer-update notification text. Mirrors the new-offer format but
 * with an "updated" header. Full offer info is included (per spec).
 */
export const formatOfferUpdateMessage = (offer: any): { text: string; url: string | null } => {
  const base = formatNewOfferMessage(offer);
  const text = base.text.replace('<b>Добавлен новый оффер</b>', '<b>Оффер обновлён</b>');
  return { text, url: base.url };
};

/**
 * Select active, linked users who favorited any of the offer's payment
 * services and opted into offer-update notifications.
 */
const selectOfferUpdateRecipients = async (
  offer: any,
): Promise<{ id: number; telegramChatId: string }[]> => {
  const paymentServiceIds = (offer?.paymentServices || [])
    .map((ps: any) => ps?.paymentService?.id ?? ps?.paymentServiceId)
    .filter((id: any) => typeof id === 'number');

  if (!paymentServiceIds.length) return [];

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      notificationsEnabled: true,
      notifyOfferUpdates: true,
      telegramChatId: { not: null },
      favorites: { some: { paymentServiceId: { in: paymentServiceIds } } },
    },
    select: { id: true, telegramChatId: true },
  });

  return users.filter((u): u is { id: number; telegramChatId: string } => !!u.telegramChatId);
};

/**
 * Fire-and-forget dispatch of an offer-update notification to subscribers of
 * favorited payment services. No-op when no monitored field changed.
 */
export const dispatchOfferUpdateNotifications = (offer: any, changedFields: string[]): void => {
  if (!isTelegramConfigured()) return;
  if (!offer || offer.isActive === false) return;
  if (!changedFields || changedFields.length === 0) return;

  void (async () => {
    try {
      const recipients = await selectOfferUpdateRecipients(offer);
      if (!recipients.length) return;

      const { text, url } = formatOfferUpdateMessage(offer);
      await sendToRecipients(recipients, text, url, 'offer update notification');
    } catch (err) {
      console.error('[telegram] offer-update dispatch error', err);
    }
  })();
};

interface BroadcastFilter {
  roleIds?: number[];
  onlyWithBot?: boolean;
}

const selectBroadcastRecipients = async (filter: BroadcastFilter) => {
  const where: any = {
    isActive: true,
    telegramChatId: { not: null },
  };
  if (filter.roleIds && filter.roleIds.length > 0) {
    where.roleId = { in: filter.roleIds };
  }
  return prisma.user.findMany({
    where,
    select: { id: true, telegramChatId: true },
  });
};

export const createBroadcast = async (
  createdById: number,
  payload: { text: string; roleIds?: number[]; onlyWithBot?: boolean },
) => {
  const filter: BroadcastFilter = {
    roleIds: payload.roleIds,
    onlyWithBot: payload.onlyWithBot ?? true,
  };

  const recipients = await selectBroadcastRecipients(filter);

  const broadcast = await prisma.telegramBroadcast.create({
    data: {
      text: payload.text,
      targetFilter: filter as any,
      status: 'pending',
      createdById,
      totalCount: recipients.length,
      deliveries: {
        create: recipients.map((r) => ({ userId: r.id, status: 'pending' })),
      },
    },
  });

  void runBroadcast(broadcast.id);

  return broadcast;
};

const runBroadcast = async (broadcastId: number) => {
  if (!isTelegramConfigured()) {
    await prisma.telegramBroadcast.update({
      where: { id: broadcastId },
      data: { status: 'failed', finishedAt: new Date() },
    });
    return;
  }

  const broadcast = await prisma.telegramBroadcast.findUnique({
    where: { id: broadcastId },
    include: {
      deliveries: {
        include: { user: { select: { id: true, telegramChatId: true, isActive: true } } },
      },
    },
  });

  if (!broadcast) return;

  await prisma.telegramBroadcast.update({
    where: { id: broadcastId },
    data: { status: 'sending', startedAt: new Date() },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const delivery of broadcast.deliveries) {
    const user = delivery.user;

    if (!user || !user.isActive || !user.telegramChatId) {
      skipped++;
      await prisma.telegramBroadcastDelivery.update({
        where: { id: delivery.id },
        data: { status: 'skipped', errorMessage: 'user_inactive_or_unlinked' },
      });
      continue;
    }

    const result = await sendMessage({
      chatId: user.telegramChatId,
      text: broadcast.text,
      parseMode: 'HTML',
    });

    if (result.ok) {
      sent++;
      await prisma.telegramBroadcastDelivery.update({
        where: { id: delivery.id },
        data: { status: 'sent', sentAt: new Date() },
      });
    } else {
      failed++;
      await prisma.telegramBroadcastDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          errorMessage: result.description || `error_${result.errorCode ?? result.status}`,
        },
      });

      if (result.errorCode === 403) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null },
          })
          .catch(() => undefined);
      }
    }

    await new Promise((r) => setTimeout(r, 40));
  }

  await prisma.telegramBroadcast.update({
    where: { id: broadcastId },
    data: {
      status: 'completed',
      finishedAt: new Date(),
      sentCount: sent,
      failedCount: failed,
      skippedCount: skipped,
    },
  });
};

type BroadcastDisplayStatus = 'queued' | 'sending' | 'sent' | 'partial' | 'not_sent' | 'failed';

const resolveDisplayStatus = (b: {
  status: string;
  sentCount: number;
  failedCount: number;
}): BroadcastDisplayStatus => {
  if (b.status === 'pending') return 'queued';
  if (b.status === 'sending') return 'sending';
  if (b.status === 'failed') return 'failed';
  if (b.sentCount === 0) return 'not_sent';
  if (b.failedCount > 0) return 'partial';
  return 'sent';
};

const buildBroadcastStatusFilter = (status?: string): Prisma.TelegramBroadcastWhereInput | undefined => {
  switch (status) {
    case 'pending':
      return { status: 'pending' };
    case 'sending':
      return { status: 'sending' };
    case 'completed':
      return { status: 'completed' };
    case 'failed':
      return { status: 'failed' };
    case 'sent':
      return { status: 'completed', sentCount: { gt: 0 }, failedCount: 0 };
    case 'partial':
      return { status: 'completed', sentCount: { gt: 0 }, failedCount: { gt: 0 } };
    case 'not_sent':
      return { OR: [{ status: 'completed', sentCount: 0 }, { status: 'failed' }] };
    default:
      return undefined;
  }
};

export const listBroadcasts = async (
  filters: { page?: number; limit?: number; search?: string; status?: string } = {},
) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));

  const where: Prisma.TelegramBroadcastWhereInput = {};
  const search = filters.search?.trim();
  if (search) {
    where.createdBy = {
      is: {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
    };
  }
  const statusFilter = buildBroadcastStatusFilter(filters.status);
  if (statusFilter) Object.assign(where, statusFilter);

  const [items, total] = await Promise.all([
    prisma.telegramBroadcast.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: { select: { id: true, username: true, email: true } },
      },
    }),
    prisma.telegramBroadcast.count({ where }),
  ]);

  return {
    data: items.map((b) => ({ ...b, displayStatus: resolveDisplayStatus(b) })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getBroadcastStats = async () => {
  const [
    totalBroadcasts,
    withErrors,
    inQueue,
    sent,
    deliveredAgg,
    reachedRows,
  ] = await Promise.all([
    prisma.telegramBroadcast.count(),
    prisma.telegramBroadcast.count({
      where: { OR: [{ status: 'failed' }, { failedCount: { gt: 0 } }] },
    }),
    prisma.telegramBroadcast.count({ where: { status: { in: ['pending', 'sending'] } } }),
    prisma.telegramBroadcast.count({ where: { status: 'completed' } }),
    prisma.telegramBroadcast.aggregate({ _sum: { sentCount: true } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT "userId")::bigint AS count
      FROM telegram_broadcast_deliveries
      WHERE status = 'sent'
    `,
  ]);

  return {
    totalBroadcasts,
    withErrors,
    inQueue,
    sent,
    totalDelivered: deliveredAgg._sum.sentCount ?? 0,
    reachedUsers: Number(reachedRows[0]?.count ?? 0),
  };
};

export const getBroadcast = async (id: number) => {
  const broadcast = await prisma.telegramBroadcast.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, username: true, email: true } },
      deliveries: {
        include: {
          user: { select: { id: true, username: true, email: true, telegramUsername: true } },
        },
      },
    },
  });
  if (!broadcast) throw new Error(__('telegram.broadcast_not_found'));
  return broadcast;
};
