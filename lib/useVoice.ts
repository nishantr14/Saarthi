"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Voice hook. `speak` uses Sarvam TTS (base64 WAV) when the server has a key,
 * otherwise the browser speechSynthesis. `record`/`stop` capture mic audio and
 * transcribe via Sarvam STT, falling back to nothing (caller keeps text input).
 */
export function useVoice() {
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    try {
      setSpeaking(true);
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.fallback && data.audioBase64) {
        const audio = new Audio(`data:${data.mime ?? "audio/wav"};base64,${data.audioBase64}`);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        await audio.play();
        return;
      }
    } catch {
      /* fall through to browser TTS */
    }
    // Browser fallback.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } else {
      setSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    const mr = mediaRef.current;
    if (!mr) return null;
    return new Promise((resolve) => {
      mr.onstop = async () => {
        mr.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          const form = new FormData();
          form.append("audio", blob, "clip.webm");
          const res = await fetch("/api/voice/stt", { method: "POST", body: form });
          const data = await res.json();
          resolve(data.fallback ? null : data.transcript ?? null);
        } catch {
          resolve(null);
        }
      };
      mr.stop();
    });
  }, []);

  return { speak, stopSpeaking, speaking, startRecording, stopRecording, recording };
}
