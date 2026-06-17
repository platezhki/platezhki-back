/**
 * Register, delete, or inspect the Telegram bot webhook.
 *
 * Usage:
 *   npx ts-node src/scripts/telegram-webhook.ts set
 *   npx ts-node src/scripts/telegram-webhook.ts delete
 *   npx ts-node src/scripts/telegram-webhook.ts info
 *
 * Reads TELEGRAM_BOT_TOKEN, API_PUBLIC_URL and TELEGRAM_WEBHOOK_SECRET from env.
 */
import 'dotenv/config';
import { deleteWebhook, getMe, setWebhook } from '../services/telegram-client.service';

const buildWebhookUrl = (): string => {
  const base = process.env.API_PUBLIC_URL;
  if (!base) throw new Error('API_PUBLIC_URL is not configured');
  return `${base.replace(/\/$/, '')}/api/telegram/webhook`;
};

async function main() {
  const action = (process.argv[2] || 'set').toLowerCase();

  const me = await getMe();
  if (!me) {
    console.error('Could not reach Telegram getMe — check TELEGRAM_BOT_TOKEN.');
    process.exit(1);
  }
  console.log(`Bot: @${me.username} (${me.id})`);

  if (action === 'set') {
    const url = buildWebhookUrl();
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret) {
      // The webhook handler fails closed without a secret, so setting the
      // webhook without one would make the endpoint always return 503.
      console.error('TELEGRAM_WEBHOOK_SECRET is required to set the webhook.');
      process.exit(1);
    }
    const res = await setWebhook(url, secret);
    console.log(res.ok ? `Webhook set to ${url}` : `Failed: ${res.description}`);
  } else if (action === 'delete') {
    const res = await deleteWebhook();
    console.log(res.ok ? 'Webhook deleted' : `Failed: ${res.description}`);
  } else if (action === 'info') {
    // info is covered by getMe above; nothing else to do.
  } else {
    console.error(`Unknown action "${action}". Use: set | delete | info`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
