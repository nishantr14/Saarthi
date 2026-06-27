import { NextResponse } from "next/server";
import { snapshot } from "@/lib/agent";
import { briefing } from "@/lib/gemini";
import { textToSpeech } from "@/lib/sarvam";
import { formatDuration } from "@/lib/risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { tasks, assessments } = snapshot();
  const open = assessments.filter((a) => a.tier !== "calm").sort((a, b) => b.score - a.score);
  const top = open.slice(0, 3).map((a) => {
    const t = tasks.find((x) => x.id === a.taskId)!;
    return `${t.title}, due in ${formatDuration(a.minutesToDeadline)}`;
  });

  const fallback =
    top.length > 0
      ? `Good ${greeting()}. You have ${open.length} deadline${open.length === 1 ? "" : "s"} that need attention. The most urgent: ${top.join("; ")}. Want me to take over and plan your day?`
      : `Good ${greeting()}. You're all clear — nothing is at risk right now. Nicely done.`;

  const text = (await briefing(`Give a 2-3 sentence spoken morning briefing. Open risky tasks: ${top.join("; ") || "none"}.`)) || fallback;

  const tts = await textToSpeech(text, "en-IN");
  return NextResponse.json({
    text,
    fallback: !tts,
    audioBase64: tts?.audioBase64,
    mime: tts?.mime,
  });
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
