import type { Task, RiskAssessment, RiskTier } from "./types";

const MIN = 60 * 1000;

export function minutesUntil(iso: string, now = Date.now()): number {
  return Math.round((new Date(iso).getTime() - now) / MIN);
}

export function remainingMinutes(task: Task): number {
  return Math.max(0, Math.round((1 - task.progress / 100) * task.estimatedMinutes));
}

export function tierForScore(score: number): RiskTier {
  if (score >= 85) return "rescue";
  if (score >= 65) return "act";
  if (score >= 40) return "nudge";
  return "calm";
}

function piecewise(p: number): number {
  // Map "pressure" (effort-left / time-left) to a 0–100 risk score.
  if (p <= 0.25) return (p / 0.25) * 40;
  if (p <= 0.6) return 40 + ((p - 0.25) / 0.35) * 25;
  if (p <= 1.0) return 65 + ((p - 0.6) / 0.4) * 20;
  if (p <= 2.0) return 85 + ((p - 1.0) / 1.0) * 15;
  return 100;
}

/**
 * Score a task's deadline risk (0–100) from time-to-deadline, effort remaining
 * and progress. The "pressure ratio" is the spine: effort-left / time-left.
 */
export function assessTask(task: Task, now = Date.now()): RiskAssessment {
  const remaining = remainingMinutes(task);
  const mtd = minutesUntil(task.deadline, now);
  const reasons: string[] = [];

  if (task.status === "done" || task.progress >= 100) {
    return { taskId: task.id, score: 0, tier: "calm", reasons: ["Completed"], remainingMinutes: 0, minutesToDeadline: mtd };
  }

  if (mtd <= 0) {
    reasons.push("Deadline has passed — overdue");
    return { taskId: task.id, score: 100, tier: "rescue", reasons, remainingMinutes: remaining, minutesToDeadline: mtd };
  }

  const pressure = remaining / Math.max(mtd, 1);
  let score = piecewise(pressure);

  // Imminent-deadline urgency bump (within 2 hours and not nearly done).
  if (mtd < 120 && task.progress < 80) {
    score += 8;
    reasons.push(`Only ${formatDuration(mtd)} left`);
  }
  // Not-started penalty as the window narrows.
  if (task.progress === 0 && mtd < 24 * 60) {
    score += 5;
    reasons.push("Not started yet");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (pressure >= 1) reasons.push(`Need ${formatDuration(remaining)} but only ${formatDuration(mtd)} remain — won't fit`);
  else if (pressure >= 0.6) reasons.push(`Tight: ${formatDuration(remaining)} of work in a ${formatDuration(mtd)} window`);
  else reasons.push(`${formatDuration(remaining)} of work, ${formatDuration(mtd)} buffer`);

  if (task.progress > 0) reasons.push(`${task.progress}% done`);

  return { taskId: task.id, score, tier: tierForScore(score), reasons, remainingMinutes: remaining, minutesToDeadline: mtd };
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h < 24) return rem ? `${h}h ${rem}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH ? `${d}d ${remH}h` : `${d}d`;
}

export const TIER_META: Record<RiskTier, { label: string; color: string; description: string }> = {
  calm: { label: "On track", color: "calm", description: "Plan is healthy. Saarthi is watching quietly." },
  nudge: { label: "At risk", color: "risk", description: "Saarthi will nudge you and suggest a focus block." },
  act: { label: "Acting", color: "saffron", description: "Saarthi is booking time and drafting a starting point." },
  rescue: { label: "Rescue", color: "danger", description: "Saarthi is taking over to save this deadline." },
};
