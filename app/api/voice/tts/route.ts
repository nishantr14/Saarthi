import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/sarvam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { text, lang } = await req.json().catch(() => ({ text: "" }));
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const result = await textToSpeech(text, lang ?? "en-IN");
  if (!result) {
    // No Sarvam key — tell the client to use the browser's speechSynthesis.
    return NextResponse.json({ fallback: true, text });
  }
  return NextResponse.json({ fallback: false, audioBase64: result.audioBase64, mime: result.mime });
}
