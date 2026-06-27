import type { IntegrationStatus } from "./types";

export const env = {
  geminiKey: process.env.GEMINI_API_KEY?.trim() || "",
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
  sarvamKey: process.env.SARVAM_API_KEY?.trim() || "",
  sarvamTtsModel: process.env.SARVAM_TTS_MODEL?.trim() || "bulbul:v3",
  sarvamSpeaker: process.env.SARVAM_TTS_SPEAKER?.trim() || "anushka",
  sarvamSttModel: process.env.SARVAM_STT_MODEL?.trim() || "saaras:v3",
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
  googleRedirect: process.env.GOOGLE_REDIRECT_URI?.trim() || "",
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim() || "",
  forcedDemo: process.env.DEMO_MODE?.trim() === "true",
};

export function hasGemini(): boolean {
  return !env.forcedDemo && env.geminiKey.length > 0;
}
export function hasSarvam(): boolean {
  return !env.forcedDemo && env.sarvamKey.length > 0;
}
export function hasGoogle(): boolean {
  return (
    !env.forcedDemo &&
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
