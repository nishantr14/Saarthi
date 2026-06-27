"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Radar, Brain, CalendarCheck, Mail, Bell, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { AgentAction, AgentActionType } from "@/lib/types";
import { TIER_CLASS } from "./RiskMeter";

const ICON: Record<AgentActionType, typeof Radar> = {
  sense: Radar,
  plan: Brain,
  book_block: CalendarCheck,
  draft_email: Mail,
  nudge: Bell,
  replan: RefreshCw,
  rescue: ShieldAlert,
  complete: CheckCircle2,
};

function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function ActivityFeed({ actions }: { actions: AgentAction[] }) {
  return (
    <div className="space-y-2.5">
      <AnimatePresence initial={false}>
        {actions.slice(0, 14).map((a) => {
          const Icon = ICON[a.type] ?? Radar;
          const t = TIER_CLASS[a.tier];
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, x: -12, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/50 p-3"
            >
              <div className={`mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{a.summary}</p>
                  <span className="flex-none text-[11px] text-muted">{timeAgo(a.ts)}</span>
                </div>
                {a.detail && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{a.detail}</p>}
                {a.simulated && (
                  <span className="mt-1 inline-block rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">demo</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {actions.length === 0 && <p className="py-8 text-center text-sm text-muted">No agent activity yet. Hit “Run agent”.</p>}
    </div>
  );
}
