"use client";

import { motion } from "framer-motion";
import { X, Radar, Brain, CalendarCheck, Mail, Volume2, Cpu } from "lucide-react";
import type { AgentName, TraceStep } from "@/lib/types";

const AGENT_META: Record<AgentName, { icon: typeof Radar; color: string; blurb: string }> = {
  Sentinel: { icon: Radar, color: "hsl(0 84% 62%)", blurb: "senses risk" },
  Planner: { icon: Brain, color: "hsl(256 90% 66%)", blurb: "decides actions" },
  Scheduler: { icon: CalendarCheck, color: "hsl(152 62% 45%)", blurb: "books time" },
  Drafter: { icon: Mail, color: "hsl(32 96% 56%)", blurb: "writes emails" },
  Voice: { icon: Volume2, color: "hsl(270 85% 60%)", blurb: "nudges you" },
};

export function SwarmTrace({
  trace,
  llmDriven,
  onClose,
}: {
  trace: TraceStep[];
  llmDriven: boolean;
  onClose: () => void;
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
        initial={{ scale: 0.95, y: 18, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl brand-bg text-white shadow-glow">
              <Cpu className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-extrabold">Agent swarm</h2>
              <p className="text-xs text-muted">
                {llmDriven ? "Gemini function-calling drove these decisions" : "deterministic planner (LLM rate-limited)"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* agent legend */}
        <div className="flex flex-wrap gap-1.5 border-b border-line px-5 py-3">
          {(Object.keys(AGENT_META) as AgentName[]).map((a) => {
            const m = AGENT_META[a];
            return (
              <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
                {a}
              </span>
            );
          })}
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-5">
          {trace.map((s, i) => {
            const m = AGENT_META[s.agent];
            const Icon = m.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3"
              >
                <span
                  className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl"
                  style={{ background: `${m.color}1f`, color: m.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: m.color }}>{s.agent}</span>
                    <span className="text-[11px] text-muted">{m.blurb}</span>
                    {s.tool && <span className="ml-auto rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">{s.tool}()</span>}
                  </div>
                  {s.thought && <p className="mt-1 text-sm leading-snug">{s.thought}</p>}
                  {s.result && <p className="mt-1 text-xs text-muted">→ {s.result}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="border-t border-line p-4">
          <button onClick={onClose} className="w-full rounded-xl brand-bg py-3 font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5">
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
