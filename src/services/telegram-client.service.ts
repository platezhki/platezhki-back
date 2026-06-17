/**
 * Thin wrapper around the Telegram Bot HTTP API.
 *
 * Reads TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME from env. Uses Node's
 * built-in fetch (Node 18+) so no extra SDK dependency is required.
 */

const API_BASE = 'https://api.telegram.org';

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface TelegramSendOptions {
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  disableWebPagePreview?: boolean;
  replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] };
}

export interface TelegramSendResult {
  ok: boolean;
  status: number;
  description?: string;
  errorCode?: number;
  retryAfter?: number;
  messageId?: number;
}

const getToken = (): string => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }
  return token;
};

export const getBotUsername = (): string => {
  const username = process.env.TELEGRAM_BOT_USERNAME;
  if (!username) {
    throw new Error('TELEGRAM_BOT_USERNAME is not configured');
  }
  // Telegram deep-link expects username without the leading @
  return username.replace(/^@/, '');
};

export const isTelegramConfigured = (): boolean => {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);
};

export const buildStartLink = (token: string): string => {
  const username = getBotUsername();
  return `https://t.me/${username}?start=${encodeURIComponent(token)}`;
};

const callMethod = async <T = any>(method: string, body: Record<string, any>): Promise<{ ok: boolean; status: number; data: any }> => {
  const token = getToken();
  const url = `${API_BASE}/bot${token}/${method}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { ok: response.ok && data?.ok === true, status: response.status, data };
};

export const sendMessage = async (options: TelegramSendOptions): Promise<TelegramSendResult> => {
  const body: Record<string, any> = {
    chat_id: options.chatId,
    text: options.text,
    parse_mode: options.parseMode ?? 'HTML',
    disable_web_page_preview: options.disableWebPagePreview ?? false,
  };

  if (options.replyMarkup) {
    body.reply_markup = options.replyMarkup;
  }

  const { ok, status, data } = await callMethod('sendMessage', body);

  if (ok) {
    return { ok: true, status, messageId: data?.result?.message_id };
  }

  return {
    ok: false,
    status,
    description: data?.description,
    errorCode: data?.error_code,
    retryAfter: data?.parameters?.retry_after,
  };
};

export const setWebhook = async (url: string, secretToken?: string): Promise<{ ok: boolean; description?: string }> => {
  const body: Record<string, any> = { url, allowed_updates: ['message', 'callback_query'] };
  if (secretToken) body.secret_token = secretToken;
  const { ok, data } = await callMethod('setWebhook', body);
  return { ok, description: data?.description };
};

export const deleteWebhook = async (): Promise<{ ok: boolean; description?: string }> => {
  const { ok, data } = await callMethod('deleteWebhook', {});
  return { ok, description: data?.description };
};

export const getMe = async (): Promise<any> => {
  const { ok, data } = await callMethod('getMe', {});
  return ok ? data?.result : null;
};

/**
 * Long-poll for updates (used by the local dev runner instead of a webhook).
 * `offset` should be the last processed update_id + 1 to acknowledge handled
 * updates. `timeout` is the server-side long-poll timeout in seconds.
 */
export const getUpdates = async (
  offset?: number,
  timeout = 30,
): Promise<any[]> => {
  const { ok, data } = await callMethod('getUpdates', {
    offset,
    timeout,
    allowed_updates: ['message', 'callback_query'],
  });
  return ok ? data?.result ?? [] : [];
};
