import { addActions, addBlocks, listTasks, getTask } from "./store";
import { assessTask, formatDuration, minutesUntil, remainingMinutes } from "./risk";
import { bookFocusBlock, busySlots, createGmailDraft } from "./google";
import { draftEmail, briefing as aiBriefing } from "./gemini";
import type {
  AgentAction,
  AgentRunResult,
  PlanBlock,
  RescueResult,
  RiskAssessment,
  Task,
} from "./types";

function uid(p = "id") {
  return `${p}_${Math.random().toString(36).slice(2, 9)}`;
}
function nowIso() {
  return new Date().toISOString();
}

const ALIGN = 15 * 60 * 1000; // align blocks to 15-min boundaries
const MAX_BLOCK = 90; // minutes

interface Busy {
  start: number;
  end: number;
}

/** Find the earliest free slot of `durationMin` at/after `cursor`, before `deadline`. */
function findSlot(cursorMs: number, durationMin: number, busy: Busy[], deadlineMs: number): { start: number; end: number } | null {
  let start = Math.ceil(cursorMs / ALIGN) * ALIGN;
  const durMs = durationMin * 60 * 1000;
  // Try forward in 15-min steps until we run out of runway before the deadline.
  for (let i = 0; i < 200; i++) {
    const end = start + durMs;
    if (end > deadlineMs) return null;
    const clash = busy.find((b) => start < b.end && end > b.start);
    if (!clash) return { start, end };
    start = Math.ceil(clash.end / ALIGN) * ALIGN; // jump past the conflict
  }
  return null;
}

function isEmailLike(task: Task): boolean {
  return /(send|email|mail|invoice|reply|follow.?up|reach out|message|inform)/i.test(
    task.title + " " + (task.description ?? "")
  );
}

/**
 * Run one full autonomous cycle: Sense → Think → Act → Reflect.
 * Returns every action taken plus a spoken briefing.
 */
export async function runAgentCycle(): Promise<AgentRunResult> {
  const actions: AgentAction[] = [];
  const newBlocks: PlanBlock[] = [];
  const now = Date.now();

  // ── SENSE ────────────────────────────────────────────────────────────
  const tasks = listTasks().filter((t) => t.status !== "done");
  const busyRaw = await busySlots();
  const busy: Busy[] = busyRaw.map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));
  actions.push({
    id: uid("a"),
    ts: nowIso(),
    type: "sense",
    tier: "calm",
    summary: `Sensed ${tasks.length} open tasks${busy.length ? ` and ${busy.length} calendar conflicts` : ""}`,
    simulated: busyRaw.length === 0,
  });

  // ── THINK ────────────────────────────────────────────────────────────
  const assessments: RiskAssessment[] = tasks
    .map((t) => assessTask(t, now))
    .sort((a, b) => b.score - a.score);

  let cursor = now + 5 * 60 * 1000; // start scheduling 5 min from now
  let booked = 0;
  let drafted = 0;
  let nudged = 0;

  // ── ACT ──────────────────────────────────────────────────────────────
  for (const a of assessments) {
    const task = getTask(a.taskId)!;
    if (a.tier === "calm") continue;

    if (a.tier === "nudge") {
      actions.push({
        id: uid("a"),
        ts: nowIso(),
        type: "nudge",
        tier: "nudge",
        taskId: task.id,
        summary: `Nudge: "${task.title}" is at risk`,
        detail: a.reasons.join(" · "),
        simulated: false,
      });
      nudged++;
      continue;
    }

    // tier === "act" or "rescue": book a focus block.
    const dur = Math.min(remainingMinutes(task) || task.estimatedMinutes, MAX_BLOCK);
    const slot = findSlot(cursor, dur, busy, new Date(task.deadline).getTime());
    if (slot) {
      const cal = await bookFocusBlock({
        title: task.title,
        start: new Date(slot.start).toISOString(),
        end: new Date(slot.end).toISOString(),
      });
      const block: PlanBlock = {
        id: uid("blk"),
        taskId: task.id,
        title: task.title,
        start: new Date(slot.start).toISOString(),
        end: new Date(slot.end).toISOString(),
        booked: !cal.simulated,
        simulated: cal.simulated,
      };
      newBlocks.push(block);
      busy.push({ start: slot.start, end: slot.end });
      cursor = slot.end + ALIGN;
      booked++;
      actions.push({
        id: uid("a"),
        ts: nowIso(),
        type: "book_block",
        tier: a.tier,
        taskId: task.id,
        summary: `${cal.simulated ? "(demo) " : ""}Booked ${formatDuration(dur)} focus block for "${task.title}"`,
        detail: `${new Date(slot.start).toLocaleString()} → ${new Date(slot.end).toLocaleTimeString()}`,
        simulated: cal.simulated,
      });
    }

    // For email-like tasks, draft a real starting point.
    if (isEmailLike(task)) {
      const d = await draftEmail(task);
      const res = await createGmailDraft({ subject: d.subject, body: d.body });
      drafted++;
      actions.push({
        id: uid("a"),
        ts: nowIso(),
        type: "draft_email",
        tier: a.tier,
        taskId: task.id,
        summary: `${res.simulated ? "(demo) " : ""}Drafted email: "${d.subject}"`,
        detail: d.body.slice(0, 160) + (d.body.length > 160 ? "…" : ""),
        simulated: res.simulated,
      });
    }

    if (a.tier === "rescue") {
      actions.push({
        id: uid("a"),
        ts: nowIso(),
        type: "rescue",
        tier: "rescue",
        taskId: task.id,
        summary: `Taking over "${task.title}" — highest risk`,
        detail: a.reasons.join(" · "),
        simulated: false,
      });
    }
  }

  // ── REFLECT ──────────────────────────────────────────────────────────
  const topRescue = assessments.filter((a) => a.tier === "rescue");
  const summaryLine =
    `I sensed ${tasks.length} open tasks, booked ${booked} focus block${booked === 1 ? "" : "s"}, ` +
    `drafted ${drafted} email${drafted === 1 ? "" : "s"}, and flagged ${nudged} to watch.` +
    (topRescue.length ? ` ${topRescue.length} ${topRescue.length === 1 ? "deadline is" : "deadlines are"} in the danger zone.` : "");

  const spoken =
    (await aiBriefing(
      `You just ran an autonomous planning cycle. Booked ${booked} focus blocks, drafted ${drafted} emails, flagged ${nudged} risky tasks. Riskiest: ${topRescue.map((a) => getTask(a.taskId)?.title).join(", ") || "none critical"}.`
    )) || summaryLine;

  actions.push({
    id: uid("a"),
    ts: nowIso(),
    type: "plan",
    tier: topRescue.length ? "rescue" : booked ? "act" : "calm",
    summary: "Cycle complete — plan is live",
    detail: summaryLine,
    simulated: false,
  });

  addBlocks(newBlocks);
  addActions(actions);

  return { actions, blocks: newBlocks, assessments, briefing: spoken };
}

/**
 * Rescue Mode — triage everything and produce a do-this-now plan for the next
 * 2 hours, prepping the top items (drafts + blocks) immediately.
 */
export async function runRescue(): Promise<RescueResult> {
  const now = Date.now();
  const tasks = listTasks().filter((t) => t.status !== "done");
  const assessments = tasks.map((t) => assessTask(t, now)).sort((a, b) => b.score - a.score);

  const actions: AgentAction[] = [];
  const newBlocks: PlanBlock[] = [];
  let cursor = now + 2 * 60 * 1000;
  let budget = 120; // a 2-hour rescue window
  const steps: RescueResult["steps"] = [];

  for (const a of assessments) {
    if (budget <= 0) break;
    const task = getTask(a.taskId)!;
    const slice = Math.min(remainingMinutes(task) || task.estimatedMinutes, budget, MAX_BLOCK);
    if (slice < 5) continue;

    let prepped = false;
    if (isEmailLike(task)) {
      const d = await draftEmail(task);
      const res = await createGmailDraft({ subject: d.subject, body: d.body });
      prepped = true;
      actions.push({
        id: uid("a"),
        ts: nowIso(),
        type: "draft_email",
        tier: "rescue",
        taskId: task.id,
        summary: `${res.simulated ? "(demo) " : ""}Pre-drafted "${d.subject}" so you just review & send`,
        simulated: res.simulated,
      });
    }

    const slot = findSlot(cursor, slice, [], new Date(task.deadline).getTime()) ?? { start: cursor, end: cursor + slice * 60000 };
    const cal = await bookFocusBlock({
      title: task.title,
      start: new Date(slot.start).toISOString(),
      end: new Date(slot.end).toISOString(),
    });
    newBlocks.push({
      id: uid("blk"),
      taskId: task.id,
      title: task.title,
      start: new Date(slot.start).toISOString(),
      end: new Date(slot.end).toISOString(),
      booked: !cal.simulated,
      simulated: cal.simulated,
    });
    cursor = slot.end + ALIGN;
    budget -= slice;
    prepped = prepped || true;

    steps.push({
      taskId: task.id,
      title: task.title,
      minutes: slice,
      why: a.reasons[0] ?? "Highest deadline risk",
      prepped,
    });
  }

  const list = steps.map((s, i) => `${i + 1}. ${s.title} (${formatDuration(s.minutes)})`).join("  ");
  const fallback =
    steps.length > 0
      ? `Okay, here's your rescue plan for the next 2 hours. ${list}. I've already prepped what I could — drafts are written and your time is blocked. Start with number one, right now.`
      : `Good news — nothing is in the danger zone right now. You're clear.`;

  const spoken =
    (await aiBriefing(
      `The user hit Rescue Mode (panic). Give a calm, firm 2-3 sentence pep talk + tell them to start the first task now. Their rescue queue: ${list || "nothing critical"}.`
    )) || fallback;

  actions.push({
    id: uid("a"),
    ts: nowIso(),
    type: "rescue",
    tier: "rescue",
    summary: `Rescue Mode: triaged ${tasks.length} tasks into a 2-hour survival plan`,
    detail: list,
    simulated: false,
  });

  addBlocks(newBlocks);
  addActions(actions);

  return { steps, briefing: spoken, actions };
}

/** Lightweight read model for the dashboard. */
export function snapshot(now = Date.now()) {
  const tasks = listTasks();
  const assessments = tasks.map((t) => assessTask(t, now));
  return { tasks, assessments };
}

export { minutesUntil };
