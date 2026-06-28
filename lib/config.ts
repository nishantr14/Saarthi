import type { IntegrationStatus } from "./types";

export const env = {
  geminiKey: process.env.GEMINI_API_KEY?.trim() || "",
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite",
  sarvamKey: process.env.SARVAM_API_KEY?.trim() || "",
  sarvamTtsModel: process.env.SARVAM_TTS_MODEL?.trim() || "bulbul:v3",
  sarvamSpeaker: process.env.SARVAM_TTS_SPEAKER?.trim() || "priya",
  sarvamSttModel: process.env.SARVAM_STT_MODEL?.trim() || "saaras:v3",
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
  googleRedirect: process.env.GOOGLE_REDIRECT_URI?.trim() || "",
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim() || "",
  forcedDemo: process.env.DEMO_MODE?.trim() === "true",
  // Public-link safety: keep Gemini + Sarvam live, but SIMULATE Calendar/Gmail
  // writes so a public visitor can't create real events/drafts in your account.
  simulateGoogle: process.env.SIMULATE_GOOGLE?.trim() === "true",
  // Secret that Cloud Scheduler presents to the /api/cron endpoint.
  cronSecret: process.env.CRON_SECRET?.trim() || "",
  // Telegram proactive nudges (optional).
  telegramToken: process.env.TELEGRAM_BOT_TOKEN?.trim() || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID?.trim() || "",
};

export function hasTelegram(): boolean {
  return env.telegramToken.length > 0 && env.telegramChatId.length > 0;
}

export function hasGemini(): boolean {
  return !env.forcedDemo && env.geminiKey.length > 0;
}
export function hasSarvam(): boolean {
  return !env.forcedDemo && env.sarvamKey.length > 0;
}
export function hasGoogle(): boolean {
  return (
    !env.forcedDemo &&
    !env.simulateGoogle &&
    env.googleClientId.length > 0 &&
    env.googleClientSecret.length > 0 &&
    env.googleRefreshToken.length > 0
  );
}

export function integrationStatus(): IntegrationStatus {
  const gemini = hasGemini();
  const sarvam = hasSarvam();
  const google = hasGoogle();
  return { gemini, sarvam, google, demoMode: env.forcedDemo || !(gemini && google) };
}
