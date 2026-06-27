import { NextResponse } from "next/server";
import { runRescue } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runRescue();
  return NextResponse.json(result);
}
