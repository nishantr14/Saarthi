import { NextRequest, NextResponse } from "next/server";
import { chatRespond, guessCategory } from "@/lib/gemini";
import { listTasks, createTask, addActions } from "@/lib/store";
import { runAgentCycle, runRescue } from "@/lib/agent";
import { assessTask } from "@/lib/risk";
import { bookFocusBlock } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { message, history } = await req.json().catch(() => ({ message: "" }));
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const tasks = listTasks();
  const summary = tasks
    .map((t) => `- ${t.title} (due ${new Date(t.deadline).toLocaleString()}, ${t.progress}% done)`)
    .join("\n");

  const result = await chatRespond(message, summary, Array.isArray(history) ? history : []);

  // Carry out the decided intent so the agent actually *does* something.
  if (result.intent === "add_task" && result.task?.title) {
    // Single LLM call already happened (chatRespond). Create the task directly —
    // no second round-trip — so the reply is fast.
    const estimate = result.task.estimatedMinutes ?? 45;
    const task = createTask({
      title: result.task.title,
      deadline: result.task.deadline,
      estimatedMinutes: estimate,
      category: guessCategory(result.task.title),
      source: "voice",
      subtasks: [],
    });

    // If it has a deadline, put it on the real Google Calendar right away so the
    // user sees it appear (a focus block ending at the deadline).
    if (task.deadline) {
      const end = new Date(task.deadline);
      const start = new Date(end.getTime() - Math.min(estimate, 60) * 60000);
      const cal = await bookFocusBlock({ title: task.title, start: start.toISOString(), end: end.toISOString() });
      addActions([{
        id: `a_${Date.now()}`, ts: new Date().toISOString(), type: "book_block", tier: "act", agent: "Scheduler",
        taskId: task.id, summary: `${cal.simulated ? "(demo) " : ""}Added "${task.title}" to your calendar`,
        detail: `${start.toLocaleString()} → ${end.toLocaleTimeString()}`, simulated: cal.simulated,
      }]);
    }
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
