import { env, hasTelegram } from "./config";

/**
 * Proactive nudges over Telegram. No-op unless TELEGRAM_BOT_TOKEN +
 * TELEGRAM_CHAT_ID are set — so the app is unaffected when it's off.
 * This is what makes Saarthi "reach you where you are" instead of waiting
 * passively in a tab.
 */
export async function notifyTelegram(text: string): Promise<boolean> {
  if (!hasTelegram()) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.telegramChatId, text, parse_mode: "Markdown" }),
    });
    return res.ok;
  } catch (e) {
    console.error("[telegram] send failed:", e);
    return false;
  }
}
