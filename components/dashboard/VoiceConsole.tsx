"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Volume2, Loader2 } from "lucide-react";
import { useVoice } from "@/lib/useVoice";
import { LogoMark } from "@/components/Logo";

interface Msg {
  role: "user" | "saarthi";
  text: string;
}

const SUGGESTIONS = ["Plan my day", "Rescue me — I'm out of time", "Add: pay rent by tomorrow 6pm", "What's most urgent?"];

export function VoiceConsole({ onSend }: { onSend: (text: string, history: Msg[]) => Promise<string> }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "saarthi", text: "I'm Saarthi. Tell me what's on your plate — by voice or text — and I'll plan, draft, and rescue. Try “plan my day.”" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const { speak, speaking, startRecording, stopRecording, recording } = useVoice();

  async function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    setHint(null);
    const priorHistory = messages;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setBusy(true);
    try {
      const reply = await onSend(t, priorHistory);
      setMessages((m) => [...m, { role: "saarthi", text: reply }]);
      speak(reply);
    } catch {
      setMessages((m) => [...m, { role: "saarthi", text: "Something went wrong on my end — try again." }]);
    } finally {
      setBusy(false);
    }
  }

  async function toggleMic() {
    if (recording) {
      const transcript = await stopRecording();
      if (transcript) submit(transcript);
      else setHint("Couldn't hear that — Sarvam voice needs an API key. Type instead and I'll still respond by voice.");
      return;
    }
    const ok = await startRecording();
    if (!ok) setHint("Mic isn't available here. Type your message — I'll reply out loud.");
  }

  return (
    <div className="flex h-full flex-col">
      {/* conversation */}
      <div className="mb-3 flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 280 }}>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {m.role === "saarthi" ? (
                <LogoMark className="h-7 w-7 flex-none" />
              ) : (
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
                  You
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "brand-bg text-white" : "border border-line bg-surface-2/60"
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex items-center gap-2 pl-9 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Saarthi is thinking…
          </div>
        )}
        {speaking && (
          <div className="flex items-center gap-2 pl-9 text-sm text-saffron">
            <Volume2 className="h-4 w-4 animate-pulse" /> speaking…
          </div>
        )}
      </div>

      {hint && <p className="mb-2 rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-muted">{hint}</p>}

      {/* suggestions */}
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            disabled={busy}
            className="rounded-full border border-line bg-surface-2/50 px-2.5 py-1 text-xs text-muted transition-colors hover:border-brand/40 hover:text-fg disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* input row */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          className={`relative inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl transition-colors ${
            recording ? "bg-danger text-white" : "brand-bg text-white"
          }`}
          aria-label={recording ? "Stop recording" : "Start voice input"}
        >
          {recording && <span className="absolute inset-0 rounded-xl bg-danger animate-pulse-ring" />}
          {recording ? <Square className="relative h-4 w-4" /> : <Mic className="relative h-4 w-4" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(input)}
          placeholder="Talk or type — in English or Hinglish…"
          aria-label="Message Saarthi"
          className="h-11 flex-1 rounded-xl border border-line bg-surface px-4 text-sm outline-none placeholder:text-muted/70 focus:border-brand"
        />
        <button
          onClick={() => submit(input)}
          disabled={busy || !input.trim()}
          className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-line bg-surface-2 text-fg transition-colors hover:bg-surface disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
