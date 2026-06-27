"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Check, Clock, X, Volume2 } from "lucide-react";
import type { RescueResult } from "@/lib/types";
import { formatDuration } from "@/lib/risk";

export function RescueOverlay({
  result,
  onClose,
  onReplay,
  speaking,
}: {
  result: RescueResult;
  onClose: () => void;
  onReplay: () => void;
  speaking: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,4,10,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-danger/40 bg-surface shadow-card"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-danger" />
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-fg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-danger/15 text-danger">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold">Rescue Mode</h2>
              <p className="text-sm text-muted">Your next 2 hours, triaged.</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-surface-2/50 p-3 text-sm leading-relaxed">
            <button onClick={onReplay} className={`mt-0.5 flex-none ${speaking ? "text-saffron" : "text-brand"}`} aria-label="Replay briefing">
              <Volume2 className={`h-4 w-4 ${speaking ? "animate-pulse" : ""}`} />
            </button>
            <p>{result.briefing}</p>
          </div>

          <ol className="mt-4 space-y-2.5">
            {result.steps.map((s, i) => (
              <li key={s.taskId} className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/40 p-3">
                <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full brand-bg text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{s.why}</p>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-muted">
                    <Clock className="h-3 w-3" /> {formatDuration(s.minutes)}
                  </span>
                  {s.prepped && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-calm/12 px-2 py-0.5 text-[10px] font-semibold text-calm">
                      <Check className="h-3 w-3" /> prepped
                    </span>
                  )}
                </div>
              </li>
            ))}
            {result.steps.length === 0 && <p className="py-4 text-center text-sm text-calm">Nothing critical — you&apos;re clear.</p>}
          </ol>

          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl brand-bg py-3 font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Start with #1 — go
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
