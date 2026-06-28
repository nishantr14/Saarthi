import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { env, hasGemini } from "./config";
import { listTasks, getTask, addActions, addBlocks } from "./store";
import { assessTask, formatDuration, remainingMinutes } from "./risk";
import { bookFocusBlock, createGmailDraft } from "./google";
import { draftEmail } from "./gemini";
import type { AgentAction, AgentName, AgentRunResult, PlanBlock, RiskAssessment, TraceStep } from "./types";

/**
 * The Saarthi agent swarm: a real Gemini function-calling loop. Gemini (the
 * "Planner") decides which tools to call; specialized agents (Scheduler,
 * Drafter, Voice, Sentinel) execute them. Every decision is captured as a
 * reasoning trace. Throws if Gemini is unavailable so the caller can fall back
 * to the deterministic loop.
 */

const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowIso = () => new Date().toISOString();
const ALIGN = 15 * 60 * 1000;

const TOOLS: FunctionDeclaration[] = [
  {
    name: "schedule_focus_block",
    description: "Book a protected focus block on the user's real Google Calendar for a task. Use for high-risk tasks that need dedicated work time.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: { type: SchemaType.STRING, description: "The task id to schedule" },
        minutes: { type: SchemaType.NUMBER, description: "Block length in minutes (15-90)" },
      },
      required: ["taskId", "minutes"],
    },
  },
  {
    name: "draft_email",
    description: "Draft a ready-to-send email in Gmail to make progress on a task (e.g. sending an invoice, replying to a professor). Use for tasks that involve sending or replying.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { taskId: { type: SchemaType.STRING, description: "The task id to draft an email for" } },
      required: ["taskId"],
    },
  },
  {
    name: "send_voice_nudge",
    description: "Send the user a short spoken nudge about an at-risk task. Use for medium-risk tasks that need attention but not full takeover.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: { type: SchemaType.STRING, description: "The task id" },
        message: { type: SchemaType.STRING, description: "A short, motivating nudge (max 1 sentence)" },
      },
      required: ["taskId", "message"],
    },
  },
  {
    name: "escalate_rescue",
    description: "Flag a task as critical and take over. Use only for the highest-risk deadlines that are about to be missed.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: { type: SchemaType.STRING, description: "The task id" },
        reason: { type: SchemaType.STRING, description: "Why this is critical" },
      },
      required: ["taskId", "reason"],
    },
  },
  {
    name: "finish",
    description: "Finish the cycle once every at-risk task has been handled. Provide a short spoken summary of what you did.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { summary: { type: SchemaType.STRING, description: "One or two spoken sentences summarizing the actions taken" } },
      required: ["summary"],
    },
  },
];

const TOOL_AGENT: Record<string, AgentName> = {
  schedule_focus_block: "Scheduler",
  draft_email: "Drafter",
  send_voice_nudge: "Voice",
  escalate_rescue: "Sentinel",
};

export async function runAgentSwarm(): Promise<AgentRunResult> {
  if (!hasGemini()) throw new Error("gemini unavailable");

  const now = Date.now();
  const tasks = listTasks().filter((t) => t.status !== "done");
  const assessments: RiskAssessment[] = tasks.map((t) => assessTask(t, now)).sort((a, b) => b.score - a.score);

  const actions: AgentAction[] = [];
  const blocks: PlanBlock[] = [];
  const trace: TraceStep[] = [];
  let cursor = now + 5 * 60 * 1000;
  let briefing = "";
  const nextSlot = (min: number) => {
    const start = Math.ceil(cursor / ALIGN) * ALIGN;
    cursor = start + min * 60000 + ALIGN;
    return { start, end: start + min * 60000 };
  };

  // Sentinel: deterministic risk sensing (the swarm's first agent).
  trace.push({
    agent: "Sentinel",
    thought: `Assessed ${tasks.length} open tasks. ${assessments.filter((a) => a.tier !== "calm").length} need attention; riskiest: ${
      assessments[0] ? `${getTask(assessments[0].taskId)?.title} (risk ${assessments[0].score})` : "none"
    }.`,
  });
  actions.push({
    id: uid("a"), ts: nowIso(), type: "sense", tier: "calm", agent: "Sentinel",
    summary: `Sentinel scanned ${tasks.length} tasks — ${assessments.filter((a) => a.tier !== "calm").length} at risk`,
    simulated: false,
  });

  const emailLike = (s: string) => /(send|email|mail|invoice|reply|follow.?up|message|inform)/i.test(s);
  const taskContext = assessments
    .map((a) => {
      const t = getTask(a.taskId)!;
      const hint = emailLike(t.title + " " + (t.description ?? "")) ? " [EMAIL TASK — draft_email]" : "";
      return `- id=${t.id} | "${t.title}" | category=${t.category} | risk=${a.score} (${a.tier}) | ${formatDuration(a.minutesToDeadline)} to deadline | ${remainingMinutes(t)} min work left | progress ${t.progress}%${hint}`;
    })
    .join("\n");

  const genAI = new GoogleGenerativeAI(env.geminiKey);
  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    tools: [{ functionDeclarations: TOOLS }],
    systemInstruction:
      "You are Saarthi's Planner agent — an autonomous chief-of-staff that protects the user from missed deadlines. " +
      "Take REAL action on EVERY at-risk task (tier act/nudge/rescue); only leave 'calm' tasks alone. Rules:\n" +
      "- For ANY task with meaningful work left and tier act or rescue: CALL schedule_focus_block to protect work time.\n" +
      "- For tasks about sending/replying/invoices/emails: ALSO call draft_email.\n" +
      "- For the single most critical (highest-risk) task: ALSO call escalate_rescue.\n" +
      "- For lower 'nudge'-tier tasks: call send_voice_nudge.\n" +
      "You may call multiple tools across multiple turns. Once every at-risk task has at least one action, call finish with a short spoken summary. " +
      "Be decisive and thorough — take real action, don't just describe.",
  });

  let chat;
  try {
    chat = model.startChat();
    let res = await chat.sendMessage(`Here are the user's open tasks (riskiest first):\n${taskContext}\n\nAct now to protect these deadlines.`);

    for (let step = 0; step < 10; step++) {
      const calls = res.response.functionCalls();
      const thought = res.response.text()?.trim();
      if (thought) trace.push({ agent: "Planner", thought });

      if (!calls || calls.length === 0) break;

      const responses = [];
      let finished = false;
      for (const call of calls) {
        const { result, agentLabel } = await execute(call.name, call.args as Record<string, unknown>, {
          actions, blocks, trace, advanceCursor: nextSlot,
        });
        if (call.name === "finish") {
          briefing = String((call.args as { summary?: string })?.summary ?? "");
          finished = true;
        }
        trace.push({ agent: agentLabel, thought: "", tool: call.name, args: call.args as Record<string, unknown>, result });
        responses.push({ functionResponse: { name: call.name, response: { result } } });
      }
      if (finished) break;
      res = await chat.sendMessage(responses);
    }
  } catch (e) {
    // If nothing was accomplished, fail so the caller falls back. Otherwise keep partial work.
    if (actions.length <= 1 && blocks.length === 0) throw e;
    console.error("[swarm] partial completion after error:", (e as Error)?.message);
  }

  // Completeness sweep: the swarm guarantees no at-risk task is left unhandled,
  // even if the Planner overlooked one. Deterministic safety net.
  const handled = new Set<string>([
    ...blocks.map((b) => b.taskId),
    ...actions.filter((a) => a.taskId && a.type !== "sense").map((a) => a.taskId!),
  ]);
  for (const a of assessments) {
    if (a.tier === "calm" || handled.has(a.taskId)) continue;
    const task = getTask(a.taskId)!;
    if (a.tier === "nudge") {
      actions.push({
        id: uid("a"), ts: nowIso(), type: "nudge", tier: "nudge", agent: "Voice", taskId: task.id,
        summary: `Voice nudge: "${task.title}" needs attention soon`, simulated: false,
      });
      trace.push({ agent: "Voice", thought: "Swept by the swarm — this at-risk task wasn't yet handled.", tool: "send_voice_nudge", result: "nudged" });
    } else {
      const min = Math.min(remainingMinutes(task) || task.estimatedMinutes, 90);
      const slot = nextSlot(min);
      const cal = await bookFocusBlock({ title: task.title, start: new Date(slot.start).toISOString(), end: new Date(slot.end).toISOString() });
      blocks.push({
        id: uid("blk"), taskId: task.id, title: task.title,
        start: new Date(slot.start).toISOString(), end: new Date(slot.end).toISOString(),
        booked: !cal.simulated, simulated: cal.simulated,
      });
      actions.push({
        id: uid("a"), ts: nowIso(), type: "book_block", tier: a.tier, agent: "Scheduler", taskId: task.id,
        summary: `${cal.simulated ? "(demo) " : ""}Scheduler booked ${formatDuration(min)} for "${task.title}"`, simulated: cal.simulated,
      });
      trace.push({ agent: "Scheduler", thought: "Swept by the swarm — protected work time the Planner missed.", tool: "schedule_focus_block", result: "booked" });
      if (emailLike(task.title + " " + (task.description ?? ""))) {
        const d = await draftEmail(task);
        const r = await createGmailDraft({ subject: d.subject, body: d.body });
        actions.push({
          id: uid("a"), ts: nowIso(), type: "draft_email", tier: a.tier, agent: "Drafter", taskId: task.id,
          summary: `${r.simulated ? "(demo) " : ""}Drafter wrote "${d.subject}"`, simulated: r.simulated,
        });
        trace.push({ agent: "Drafter", thought: "Swept — drafted the email this task needs.", tool: "draft_email", result: d.subject });
      }
    }
    handled.add(a.taskId);
  }

  if (!briefing) {
    briefing = `I handled your riskiest deadlines — ${blocks.length} focus block${blocks.length === 1 ? "" : "s"} booked and ${
      actions.filter((a) => a.type === "draft_email").length
    } email${actions.filter((a) => a.type === "draft_email").length === 1 ? "" : "s"} drafted.`;
  }

  actions.push({
    id: uid("a"), ts: nowIso(), type: "plan", tier: assessments[0]?.tier ?? "calm", agent: "Planner",
    summary: "Cycle complete — agent swarm acted on your deadlines", detail: briefing, simulated: false,
  });

  addBlocks(blocks);
  addActions(actions);
  return { actions, blocks, assessments, briefing, trace, llmDriven: true };
}

interface ExecCtx {
  actions: AgentAction[];
  blocks: PlanBlock[];
  trace: TraceStep[];
  advanceCursor: (min: number) => { start: number; end: number };
}

async function execute(name: string, args: Record<string, unknown>, ctx: ExecCtx): Promise<{ result: string; agentLabel: AgentName }> {
  const agentLabel = TOOL_AGENT[name] ?? "Planner";
  const taskId = String(args.taskId ?? "");
  const task = taskId ? getTask(taskId) : undefined;

  if (name === "schedule_focus_block") {
    if (!task) return { result: "task not found", agentLabel };
    const minutes = Math.min(Math.max(Number(args.minutes) || 45, 15), 90);
    const slot = ctx.advanceCursor(minutes);
    const cal = await bookFocusBlock({ title: task.title, start: new Date(slot.start).toISOString(), end: new Date(slot.end).toISOString() });
    ctx.blocks.push({
      id: uid("blk"), taskId: task.id, title: task.title,
      start: new Date(slot.start).toISOString(), end: new Date(slot.end).toISOString(),
      booked: !cal.simulated, simulated: cal.simulated,
    });
    ctx.actions.push({
      id: uid("a"), ts: nowIso(), type: "book_block", tier: "act", agent: "Scheduler", taskId: task.id,
      summary: `${cal.simulated ? "(demo) " : ""}Scheduler booked ${formatDuration(minutes)} for "${task.title}"`,
      detail: `${new Date(slot.start).toLocaleString()} → ${new Date(slot.end).toLocaleTimeString()}`,
      simulated: cal.simulated,
    });
    return { result: `${cal.simulated ? "simulated " : ""}booked ${minutes}m block`, agentLabel };
  }

  if (name === "draft_email") {
    if (!task) return { result: "task not found", agentLabel };
    const d = await draftEmail(task);
    const { createGmailDraft } = await import("./google");
    const r = await createGmailDraft({ subject: d.subject, body: d.body });
    ctx.actions.push({
      id: uid("a"), ts: nowIso(), type: "draft_email", tier: "act", agent: "Drafter", taskId: task.id,
      summary: `${r.simulated ? "(demo) " : ""}Drafter wrote "${d.subject}"`,
      detail: d.body.slice(0, 160) + (d.body.length > 160 ? "…" : ""), simulated: r.simulated,
    });
    return { result: `${r.simulated ? "simulated " : ""}draft created: ${d.subject}`, agentLabel };
  }

  if (name === "send_voice_nudge") {
    if (!task) return { result: "task not found", agentLabel };
    const msg = String(args.message ?? `"${task.title}" needs attention`);
    ctx.actions.push({
      id: uid("a"), ts: nowIso(), type: "nudge", tier: "nudge", agent: "Voice", taskId: task.id,
      summary: `Voice nudge: ${msg}`, simulated: false,
    });
    return { result: "nudge sent", agentLabel };
  }

  if (name === "escalate_rescue") {
    if (!task) return { result: "task not found", agentLabel };
    ctx.actions.push({
      id: uid("a"), ts: nowIso(), type: "rescue", tier: "rescue", agent: "Sentinel", taskId: task.id,
      summary: `Sentinel escalated "${task.title}" to rescue`, detail: String(args.reason ?? ""), simulated: false,
    });
    return { result: "escalated to rescue", agentLabel };
  }

  if (name === "finish") return { result: "done", agentLabel: "Planner" };

  return { result: "unknown tool", agentLabel };
}
