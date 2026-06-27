import { GoogleGenerativeAI } from "@google/generative-ai";
import { env, hasGemini } from "./config";
import type { Task } from "./types";
import { parseWhen, extractTaskTitle } from "./parse";

export interface ChatTurn {
  role: "user" | "saarthi";
  text: string;
}

/**
 * The Gemini "brain". Every function degrades gracefully to a deterministic
 * heuristic when no GEMINI_API_KEY is present, so the agent loop never breaks.
 */

async function generateJSON<T>(prompt: string): Promise<T | null> {
  if (!hasGemini()) return null;
  try {
    const genAI = new GoogleGenerativeAI(env.geminiKey);
    const model = genAI.getGenerativeModel({
      model: env.geminiModel,
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    });
    const res = await model.generateContent(prompt);
    return JSON.parse(res.response.text()) as T;
  } catch (e) {
    console.error("[gemini] JSON generation failed, using fallback:", e);
    return null;
  }
}

async function generateText(prompt: string): Promise<string | null> {
  if (!hasGemini()) return null;
  try {
    const genAI = new GoogleGenerativeAI(env.geminiKey);
    const model = genAI.getGenerativeModel({ model: env.geminiModel, generationConfig: { temperature: 0.6 } });
    const res = await model.generateContent(prompt);
    return res.response.text().trim();
  } catch (e) {
    console.error("[gemini] text generation failed, using fallback:", e);
    return null;
  }
}

export interface Decomposition {
  category: string;
  estimatedMinutes: number;
  subtasks: { title: string; estimatedMinutes: number }[];
}

/** Break a free-text task into estimated subtasks + a category. */
export async function decompose(title: string, description?: string): Promise<Decomposition> {
  const ai = await generateJSON<Decomposition>(
    `You are a productivity planner. Break this task into 2-4 concrete, actionable subtasks with realistic time estimates in minutes. Also classify it into one category (College, Work, Finance, Career, Personal, Health, or General) and give a total estimate.
Respond as JSON: {"category": string, "estimatedMinutes": number, "subtasks": [{"title": string, "estimatedMinutes": number}]}.
Task title: "${title}"
Details: "${description ?? "none"}"`
  );
  if (ai && Array.isArray(ai.subtasks) && ai.subtasks.length) return ai;

  // Heuristic fallback.
  const category = guessCategory(title + " " + (description ?? ""));
  const subtasks = [
    { title: `Get started: outline "${trim(title)}"`, estimatedMinutes: 15 },
    { title: `Do the core work for "${trim(title)}"`, estimatedMinutes: 30 },
    { title: `Review & finish "${trim(title)}"`, estimatedMinutes: 15 },
  ];
  return { category, estimatedMinutes: 60, subtasks };
}

export interface EmailDraft {
  subject: string;
  body: string;
}

/** Draft a real first-pass email the user can send (e.g., to a client/professor). */
export async function draftEmail(task: Task): Promise<EmailDraft> {
  const ai = await generateJSON<EmailDraft>(
    `Write a short, professional email that makes progress on this task. Keep it under 120 words, warm but concise, ready to send after a quick review.
Respond as JSON: {"subject": string, "body": string}.
Task: "${task.title}". Details: "${task.description ?? ""}".`
  );
  if (ai && ai.body) return ai;

  return {
    subject: `Re: ${task.title}`,
    body: `Hi,\n\nQuick note to move "${task.title}" forward. I'm on it and will have this wrapped up shortly — sharing a first version so we stay on schedule.\n\nWill follow up with the final shortly.\n\nBest,\n[Your name]`,
  };
}

export interface ChatResult {
  reply: string;
  intent: "add_task" | "run_agent" | "rescue" | "status" | "chat";
  task?: { title: string; deadline?: string; estimatedMinutes?: number };
}

/** Conversational agent turn. Returns a reply plus a structured intent. */
export async function chatRespond(message: string, tasksSummary: string, history: ChatTurn[] = []): Promise<ChatResult> {
  const transcript = history
    .slice(-6)
    .map((t) => `${t.role === "user" ? "User" : "Saarthi"}: ${t.text}`)
    .join("\n");
  const today = new Date().toISOString();

  const ai = await generateJSON<ChatResult>(
    `You are Saarthi, a proactive AI chief-of-staff that helps people beat deadlines. You are warm, direct, and action-oriented. The user may speak in English or Hinglish (e.g. "kal", "raat 10 baje", "bach lo").
Now (ISO): ${today}
Current tasks:\n${tasksSummary}\n
Recent conversation:\n${transcript || "(none)"}\n
User just said: "${message}"
Decide the intent and reply in one or two friendly sentences. Use the conversation to resolve references (e.g. a follow-up that only gives a time refers to the task mentioned just before).
- "add_task" if they describe a new task/commitment. Extract a concise title, an absolute ISO deadline if they hint at one (resolve "kal"/"tomorrow"/"raat 10 baje" against Now above), and a minutes estimate.
- "run_agent" if they want you to plan/organize/take action across everything.
- "rescue" if they sound panicked or out of time ("I'm screwed", "bach lo", "no time").
- "status" if they ask what's pending or how things look.
- "chat" otherwise.
Respond as JSON: {"reply": string, "intent": string, "task"?: {"title": string, "deadline"?: string, "estimatedMinutes"?: number}}.`
  );
  if (ai && ai.reply) return ai;
  return heuristicChat(message, history);
}

/** A warm spoken briefing the voice layer narrates. */
export async function briefing(prompt: string): Promise<string | null> {
  return generateText(
    `You are Saarthi, a calm but motivating AI chief-of-staff. In 2-3 short spoken sentences (no markdown, no lists), brief the user. Be specific and action-oriented.\n${prompt}`
  );
}

// ── Heuristics ────────────────────────────────────────────────────────────

function heuristicChat(message: string, history: ChatTurn[] = []): ChatResult {
  const m = message.toLowerCase();

  if (/(screw|panic|bach\s?lo|bacha\s?lo|no time|out of time|help me|emergency|last minute|stress|tension|phas?\s?gaya|marr?\s?gaya)/.test(m)) {
    return { reply: "Breathe — I've got you. Pulling up your most urgent deadlines and prepping what I can right now.", intent: "rescue" };
  }
  if (/(plan my|organi[sz]e|sort (my|everything)|schedule my|take over|handle everything|what should i do|plan (everything|my day)|sab kuch)/.test(m)) {
    return { reply: "On it. Planning your day, booking focus blocks, and drafting what I can.", intent: "run_agent" };
  }
  if (/(what'?s? (pending|left|due|urgent|most)|status|how (are|do) things|kya pending|kitna)/.test(m)) {
    return { reply: "Here's where things stand — your riskiest deadlines are at the top.", intent: "status" };
  }

  // Task capture with Hinglish/date understanding.
  const when = parseWhen(message);
  let title = extractTaskTitle(message);

  // Follow-up: a message that's basically just a time refers to the prior task.
  if (!title && when.iso) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "user") {
        const prior = extractTaskTitle(history[i].text);
        if (prior) { title = prior; break; }
      }
    }
  }

  const taskish =
    /(exam|test|quiz|paper|assignment|viva|project|submission|lab|report|homework|\bhw\b|deadline|due|submit|jama|pay|bill|recharge|meeting|call|interview|appointment|book|buy|email|send|presentation|demo|ppt|slide|finish|complete|prepare|prep)/.test(m);

  if (when.iso || (title && taskish)) {
    const finalTitle = title || "New task";
    const whenPart = when.label ? ` — ${when.label}` : "";
    return {
      reply: `Locked in: ${finalTitle}${whenPart}. I'll break it down and start tracking the risk.`,
      intent: "add_task",
      task: { title: finalTitle, deadline: when.iso },
    };
  }

  if (taskish) {
    const t = title || trim(message, 60);
    return { reply: `Added "${t}". When's it due? Tell me and I'll plan it.`, intent: "add_task", task: { title: t } };
  }

  return { reply: "Got it. Tell me what's due and when — e.g. “kal raat 10 baje DBMS exam” — and I'll plan it. Or say “rescue me” if you're cutting it close.", intent: "chat" };
}

export function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (/(assignment|exam|lecture|college|semester|professor|submit|viva|dbms|class)/.test(t)) return "College";
  if (/(invoice|client|meeting|deck|report|deploy|standup|ticket|deliverable)/.test(t)) return "Work";
  if (/(bill|pay|rent|emi|tax|invoice|gst|recharge)/.test(t)) return "Finance";
  if (/(interview|resume|leetcode|prep|application|offer|portfolio)/.test(t)) return "Career";
  if (/(gym|run|doctor|medicine|sleep|workout|health)/.test(t)) return "Health";
  if (/(mom|dad|friend|anniversary|birthday|dinner|gift|family)/.test(t)) return "Personal";
  return "General";
}

function trim(s: string, n = 48): string {
  const clean = s.trim().replace(/\s+/g, " ");
  return clean.length > n ? clean.slice(0, n - 1) + "…" : clean;
}
