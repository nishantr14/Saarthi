import { NextRequest, NextResponse } from "next/server";
import { updateTask } from "@/lib/store";
import { assessTask } from "@/lib/risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const task = updateTask(params.id, body);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ task, assessment: assessTask(task) });
}
