import { NextResponse } from "next/server";
import { runAgentCycle } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runAgentCycle();
  return NextResponse.json(result);
}
