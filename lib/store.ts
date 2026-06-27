import type { AgentAction, PlanBlock, Task } from "./types";

/**
 * In-memory store with a Firestore-shaped interface. Seeded with realistic
 * demo data so the deployed link always works without any database wired.
 * To go to production, swap the internals for `@google-cloud/firestore`
 * keeping the same exported functions — callers don't change.
 */

interface StoreState {
  tasks: Map<string, Task>;
  blocks: PlanBlock[];
  actions: AgentAction[];
  seededAt: number;
}

const HOUR = 60;
const DAY = 24 * HOUR;

function iso(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function seed(): StoreState {
  const tasks: Task[] = [
    {
      id: "t_dbms",
      title: "DBMS assignment — normalization + ER diagram",
      description: "Submit on the college portal. Covers 1NF–3NF and an ER diagram for the library schema.",
      deadline: iso(105), // ~1h45m, big remaining → rescue
      estimatedMinutes: 150,
      progress: 5,
      status: "in_progress",
      category: "College",
      source: "voice",
      createdAt: iso(-2 * DAY),
      subtasks: [
        { id: uid("s"), title: "Draw ER diagram for library schema", done: false, estimatedMinutes: 45 },
        { id: uid("s"), title: "Normalize tables to 3NF with steps", done: false, estimatedMinutes: 60 },
        { id: uid("s"), title: "Write up reasoning + export PDF", done: false, estimatedMinutes: 45 },
      ],
    },
    {
      id: "t_invoice",
      title: "Send Q2 invoice to Lighthouse client",
      description: "₹84,000 invoice. They asked for it by EOD; payment terms net-15.",
      deadline: iso(70), // ~70m, client wants it now → act (books + drafts email)
      estimatedMinutes: 40,
      progress: 0,
      status: "todo",
      category: "Work",
      source: "email",
      createdAt: iso(-1 * DAY),
      subtasks: [
        { id: uid("s"), title: "Pull hours from timesheet", done: false, estimatedMinutes: 10 },
        { id: uid("s"), title: "Generate invoice PDF", done: false, estimatedMinutes: 10 },
        { id: uid("s"), title: "Email to accounts@lighthouse", done: false, estimatedMinutes: 10 },
      ],
    },
    {
      id: "t_electricity",
      title: "Pay electricity bill",
      description: "Due before disconnection. Auto-pay failed last month.",
      deadline: iso(45), // due today, auto-pay failed → nudge
      estimatedMinutes: 10,
      progress: 0,
      status: "todo",
      category: "Finance",
      source: "text",
      createdAt: iso(-12 * HOUR),
      subtasks: [],
    },
    {
      id: "t_interview",
      title: "Prep for Google L4 system-design interview",
      description: "Round is in 3 days. Need to revise sharding, caching, and rate limiting.",
      deadline: iso(3 * DAY), // calm
      estimatedMinutes: 240,
      progress: 25,
      status: "in_progress",
      category: "Career",
      source: "text",
      createdAt: iso(-4 * DAY),
      subtasks: [
        { id: uid("s"), title: "Revise sharding + replication", done: true, estimatedMinutes: 60 },
        { id: uid("s"), title: "Design a rate limiter end-to-end", done: false, estimatedMinutes: 60 },
        { id: uid("s"), title: "2 mock questions out loud", done: false, estimatedMinutes: 120 },
      ],
    },
    {
      id: "t_mom",
      title: "Book Mom's anniversary dinner",
      description: "Table for 4 at the rooftop place she liked. She'll be hurt if this slips.",
      deadline: iso(5 * DAY), // calm
      estimatedMinutes: 20,
      progress: 0,
      status: "todo",
      category: "Personal",
      source: "voice",
      createdAt: iso(-6 * HOUR),
      subtasks: [],
    },
  ];

  return {
    tasks: new Map(tasks.map((t) => [t.id, t])),
    blocks: [],
    actions: [
      {
        id: uid("a"),
        ts: iso(-30),
        type: "sense",
        tier: "calm",
        summary: "Synced 5 tasks from voice, email and calendar",
        simulated: true,
      },
    ],
    seededAt: Date.now(),
  };
}

// Persist across hot reloads in dev via globalThis.
const g = globalThis as unknown as { __saarthi?: StoreState };
function state(): StoreState {
  if (!g.__saarthi) g.__saarthi = seed();
  return g.__saarthi;
}

export function listTasks(): Task[] {
  return [...state().tasks.values()].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );
}

export function getTask(id: string): Task | undefined {
  return state().tasks.get(id);
}

export function createTask(input: Partial<Task> & { title: string }): Task {
  const now = Date.now();
  const task: Task = {
    id: uid("t"),
    title: input.title,
    description: input.description,
    deadline: input.deadline ?? new Date(now + DAY * 60 * 1000).toISOString(),
    estimatedMinutes: input.estimatedMinutes ?? 30,
    progress: input.progress ?? 0,
    status: input.status ?? "todo",
    category: input.category ?? "General",
    source: input.source ?? "text",
    subtasks: input.subtasks ?? [],
    createdAt: new Date(now).toISOString(),
  };
  state().tasks.set(task.id, task);
  return task;
}

export function updateTask(id: string, patch: Partial<Task>): Task | undefined {
  const t = state().tasks.get(id);
  if (!t) return undefined;
  const updated = { ...t, ...patch };
  if (patch.progress !== undefined) {
    updated.status = patch.progress >= 100 ? "done" : patch.progress > 0 ? "in_progress" : "todo";
  }
  state().tasks.set(id, updated);
  return updated;
}

export function listBlocks(): PlanBlock[] {
  return state().blocks;
}

export function addBlocks(blocks: PlanBlock[]): void {
  state().blocks.push(...blocks);
}

export function listActions(): AgentAction[] {
  return [...state().actions].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

export function addActions(actions: AgentAction[]): void {
  state().actions.push(...actions);
}

export function reseed(): void {
  g.__saarthi = seed();
}

export { uid };
