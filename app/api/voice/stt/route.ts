import { NextRequest, NextResponse } from "next/server";
import { speechToText } from "@/lib/sarvam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ fallback: true, error: "no audio" }, { status: 200 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const result = await speechToText(buf, file.type || "audio/webm");
  if (!result) {
    // No Sarvam key — client should use the browser SpeechRecognition fallback.
    return NextResponse.json({ fallback: true });
  }
  return NextResponse.json({ fallback: false, transcript: result.transcript, language: result.language });
}
