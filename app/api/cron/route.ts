import { NextRequest, NextResponse } from "next/server";
import { runAgent, snapshot } from "@/lib/agent";
import { notifyTelegram } from "@/lib/telegram";
import { formatDuration } from "@/lib/risk";
import { env } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proactive autonomous run, designed to be hit by Google Cloud Scheduler on a
 * cadence (e.g. every 30 min). This is the "proactive" half of the problem
 * statement — Saarthi acts even when no one has the app open. Protected by a
 * shared secret so randoms can't trigger it.
 */
async function handle(req: NextRequest) {
  const key = req.headers.get("x-cron-key") || new URL(req.url).searchParams.get("key") || "";
  if (env.cronSecret && key !== env.cronSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runAgent();

  // Proactive nudge: tell the user what was just handled + what's still hot.
  const { tasks, assessments } = snapshot();
  const hot = assessments
    .filter((a) => a.tier === "rescue" || a.tier === "act")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((a) => `• *${tasks.find((t) => t.id === a.taskId)?.title}* — ${formatDuration(a.minutesToDeadline)} left (risk ${a.score})`)
    .join("\n");

  const sent = await notifyTelegram(
    `🏇 *Saarthi checked in*\n${result.briefing}` + (hot ? `\n\nStill on your radar:\n${hot}` : "")
  );

  return NextResponse.json({
    ok: true,
    llmDriven: result.llmDriven ?? false,
    blocksBooked: result.blocks.length,
    actions: result.actions.length,
    telegramSent: sent,
    briefing: result.briefing,
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
