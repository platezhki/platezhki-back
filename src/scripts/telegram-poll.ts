/**
 * Local development bot runner using long-polling instead of a webhook.
 *
 * Telegram requires a public HTTPS URL for webhooks, which localhost cannot
 * provide. This runner pulls updates via getUpdates and processes them through
 * the same handler the webhook uses, so the `/start <token>` linking flow works
 * locally with no tunnel.
 *
 * Usage:  npm run tg:poll
 *
 * Note: a bot can either use a webhook OR getUpdates, not both. This script
 * deletes any configured webhook on start so polling can receive updates.
 */
import 'dotenv/config';
import { deleteWebhook, getMe, getUpdates } from '../services/telegram-client.service';
import { processTelegramUpdate } from '../services/telegram.service';

async function main() {
  const me = await getMe();
  if (!me) {
    console.error('Could not reach Telegram getMe — check TELEGRAM_BOT_TOKEN.');
    process.exit(1);
  }
  console.log(`Polling as @${me.username}. Press Ctrl+C to stop.`);

  // Webhook and getUpdates are mutually exclusive.
  await deleteWebhook();

  let offset: number | undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const updates = await getUpdates(offset, 30);
      for (const update of updates) {
        offset = update.update_id + 1;
        try {
          await processTelegramUpdate(update);
        } catch (err) {
          console.error('[telegram] update processing error', err);
        }
      }
    } catch (err) {
      console.error('[telegram] getUpdates error, retrying in 3s', err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
