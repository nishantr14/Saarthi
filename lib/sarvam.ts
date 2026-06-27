import { env, hasSarvam } from "./config";

/**
 * Sarvam AI voice layer — the ears (saaras:v3 STT) and mouth (bulbul:v3 TTS).
 * Server-side only. Returns null when no key is set so the client can fall
 * back to the browser Web Speech / speechSynthesis APIs.
 */

const TTS_URL = "https://api.sarvam.ai/text-to-speech";
const STT_URL = "https://api.sarvam.ai/speech-to-text";

export interface TtsResult {
  audioBase64: string;
  mime: string;
}

/**
 * Convert text to speech with Bulbul v3. `lang` is a BCP-47 code such as
 * "en-IN" or "hi-IN". Bulbul caps at 2500 chars; we trim defensively.
 */
export async function textToSpeech(text: string, lang = "en-IN"): Promise<TtsResult | null> {
  if (!hasSarvam()) return null;
  try {
    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        "api-subscription-key": env.sarvamKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.slice(0, 2400),
        target_language_code: lang,
        model: env.sarvamTtsModel,
        speaker: env.sarvamSpeaker,
        pace: 1.0,
      }),
    });
    if (!res.ok) {
      console.error("[sarvam] TTS failed:", res.status, await safeText(res));
      return null;
    }
    const data = (await res.json()) as { audios?: string[]; audio?: string };
    const audio = data.audios?.[0] ?? data.audio;
    if (!audio) return null;
    return { audioBase64: audio, mime: "audio/wav" };
  } catch (e) {
    console.error("[sarvam] TTS error:", e);
    return null;
  }
}

export interface SttResult {
  transcript: string;
  language?: string;
}

/**
 * Transcribe (and, for non-English speech, translate) audio with Saaras v3.
 * Accepts the raw audio bytes and a mime type.
 */
export async function speechToText(audio: Buffer, mime = "audio/webm"): Promise<SttResult | null> {
  if (!hasSarvam()) return null;
  try {
    const form = new FormData();
    const ext = mime.includes("wav") ? "wav" : mime.includes("mp3") ? "mp3" : "webm";
    form.append("file", new Blob([new Uint8Array(audio)], { type: mime }), `clip.${ext}`);
    form.append("model", env.sarvamSttModel);
    form.append("language_code", "unknown"); // auto-detect (incl. Hinglish code-mix)

    const res = await fetch(STT_URL, {
      method: "POST",
      headers: { "api-subscription-key": env.sarvamKey },
      body: form,
    });
    if (!res.ok) {
      console.error("[sarvam] STT failed:", res.status, await safeText(res));
      return null;
    }
    const data = (await res.json()) as { transcript?: string; language_code?: string };
    if (!data.transcript) return null;
    return { transcript: data.transcript, language: data.language_code };
  } catch (e) {
    console.error("[sarvam] STT error:", e);
    return null;
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
