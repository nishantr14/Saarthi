import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasks, listBlocks, listActions, addActions } from "@/lib/store";
import { assessTask } from "@/lib/risk";
import { guessCategory } from "@/lib/gemini";
import { bookFocusBlock } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const tasks = listTasks();
  const assessments = tasks.map((t) => assessTask(t, now));
  return NextResponse.json({ tasks, assessments, blocks: listBlocks(), actions: listActions() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title: string = (body.title ?? "").toString().trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const estimate = body.estimatedMinutes ?? 45;
  const task = createTask({
    title,
    description: body.description,
    deadline: body.deadline,
    estimatedMinutes: estimate,
    category: body.category ?? guessCategory(title + " " + (body.description ?? "")),
    source: body.source ?? "text",
    subtasks: [],
  });

  // Put it on the real Google Calendar immediately if it has a deadline.
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

  return NextResponse.json({ task, assessment: assessTask(task) });
}
