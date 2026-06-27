"use client";

import { motion } from "framer-motion";
import { Check, Clock, Plus } from "lucide-react";
import type { RiskAssessment, Task } from "@/lib/types";
import { formatDuration } from "@/lib/risk";
import { RiskRing, RiskBadge, TIER_CLASS } from "./RiskMeter";

export function TaskCard({
  task,
  assessment,
  onProgress,
}: {
  task: Task;
  assessment?: RiskAssessment;
  onProgress: (id: string, progress: number) => void;
}) {
  const tier = assessment?.tier ?? "calm";
  const score = assessment?.score ?? 0;
  const mtd = assessment?.minutesToDeadline ?? 0;
  const done = task.status === "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-surface/60 p-4 transition-colors ${
        done ? "border-line opacity-60" : tier === "rescue" ? "border-danger/40" : "border-line hover:border-brand/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <RiskRing score={done ? 0 : score} tier={done ? "calm" : tier} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">{task.category}</span>
            {!done && <RiskBadge tier={tier} />}
            {done && <span className="text-xs font-semibold text-calm">Completed</span>}
          </div>
          <h3 className={`mt-1.5 font-semibold leading-snug ${done ? "line-through" : ""}`}>{task.title}</h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className={mtd < 120 && !done ? TIER_CLASS[tier].text : ""}>
                {mtd <= 0 ? "overdue" : `${formatDuration(mtd)} left`}
              </span>
            </span>
            {task.subtasks.length > 0 && <span>{task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtasks</span>}
          </div>

          {assessment && !done && (
            <p className="mt-2 line-clamp-1 text-xs text-muted/80">{assessment.reasons.join(" · ")}</p>
          )}

          {/* progress */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{ width: `${task.progress}%`, background: TIER_CLASS[done ? "calm" : tier].ring, transition: "width 500ms ease" }}
              />
            </div>
            <span className="tabular w-9 text-right font-mono text-xs text-muted">{task.progress}%</span>
            {!done ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onProgress(task.id, Math.min(100, task.progress + 25))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-muted transition-colors hover:text-fg"
                  aria-label="Add 25% progress"
                  title="+25%"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onProgress(task.id, 100)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-calm/40 bg-calm/10 text-calm transition-colors hover:bg-calm/20"
                  aria-label="Mark done"
                  title="Mark done"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
