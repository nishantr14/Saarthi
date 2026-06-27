import { NextRequest, NextResponse } from "next/server";
import { chatRespond } from "@/lib/gemini";
import { listTasks, createTask } from "@/lib/store";
import { decompose } from "@/lib/gemini";
import { runAgentCycle, runRescue } from "@/lib/agent";
import { assessTask } from "@/lib/risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { message } = await req.json().catch(() => ({ message: "" }));
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const tasks = listTasks();
  const summary = tasks
    .map((t) => `- ${t.title} (due ${new Date(t.deadline).toLocaleString()}, ${t.progress}% done)`)
    .join("\n");

  const result = await chatRespond(message, summary);

  // Carry out the decided intent so the agent actually *does* something.
  if (result.intent === "add_task" && result.task?.title) {
    const d = await decompose(result.task.title);
    const task = createTask({
      title: result.task.title,
      deadline: result.task.deadline,
      estimatedMinutes: result.task.estimatedMinutes ?? d.estimatedMinutes,
      category: d.category,
      source: "voice",
      subtasks: d.subtasks.map((s, i) => ({ id: `s_${Date.now()}_${i}`, title: s.title, done: false, estimatedMinutes: s.estimatedMinutes })),
    });
    return NextResponse.json({ ...result, createdTask: task, assessment: assessTask(task) });
  }
  if (result.intent === "run_agent") {
    const run = await runAgentCycle();
    return NextResponse.json({ ...result, run });
  }
  if (result.intent === "rescue") {
    const rescue = await runRescue();
    return NextResponse.json({ ...result, rescue });
  }

  return NextResponse.json(result);
}
