import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/store";
import { assessTask } from "@/lib/risk";
import { decompose } from "@/lib/gemini";
import { listBlocks, listActions } from "@/lib/store";

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

  // Let the brain decompose + estimate + categorize.
  const d = await decompose(title, body.description);
  const subtasks = d.subtasks.map((s, i) => ({
    id: `s_${Date.now()}_${i}`,
    title: s.title,
    done: false,
    estimatedMinutes: s.estimatedMinutes,
  }));

  const task = createTask({
    title,
    description: body.description,
    deadline: body.deadline,
    estimatedMinutes: body.estimatedMinutes ?? d.estimatedMinutes,
    category: body.category ?? d.category,
    source: body.source ?? "text",
    subtasks,
  });

  return NextResponse.json({ task, assessment: assessTask(task) });
}
