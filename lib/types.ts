// Domain model for Saarthi.

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskSource = "voice" | "text" | "calendar" | "email" | "seed";
export type RiskTier = "calm" | "nudge" | "act" | "rescue";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  estimatedMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  /** ISO timestamp of the hard deadline. */
  deadline: string;
  /** Total estimated effort in minutes. */
  estimatedMinutes: number;
  /** 0–100 completion. */
  progress: number;
  status: TaskStatus;
  category: string;
  source: TaskSource;
  subtasks: Subtask[];
  createdAt: string;
}

/** A scheduled focus block on the user's timeline / calendar. */
export interface PlanBlock {
  id: string;
  taskId: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  /** true once written to the real Google Calendar (vs. simulated). */
  booked: boolean;
  /** distinguishes a real Google Calendar write from a demo simulation. */
  simulated: boolean;
}

export type AgentActionType =
  | "sense"
  | "plan"
  | "book_block"
  | "draft_email"
  | "nudge"
  | "replan"
  | "rescue"
  | "complete";

/** One entry in the transparent agent activity feed. */
export interface AgentAction {
  id: string;
  ts: string; // ISO
  type: AgentActionType;
  tier: RiskTier;
  summary: string;
  detail?: string;
  taskId?: string;
  /** true when the action was simulated (demo mode / no creds). */
  simulated: boolean;
}

export interface RiskAssessment {
  taskId: string;
  score: number; // 0–100
  tier: RiskTier;
  /** human-readable reasons that explain the score (shown in UI). */
  reasons: string[];
  /** minutes of focused work still required. */
  remainingMinutes: number;
  /** minutes left until the deadline. */
  minutesToDeadline: number;
}

/** Result of a full Sense→Think→Act→Reflect cycle. */
export interface AgentRunResult {
  actions: AgentAction[];
  blocks: PlanBlock[];
  assessments: RiskAssessment[];
  /** spoken summary the voice layer can narrate. */
  briefing: string;
}

export interface RescueResult {
  /** ordered, do-this-now plan for the next 2 hours. */
  steps: { taskId: string; title: string; minutes: number; why: string; prepped: boolean }[];
  briefing: string;
  actions: AgentAction[];
}

export interface IntegrationStatus {
  gemini: boolean;
  sarvam: boolean;
  google: boolean;
  demoMode: boolean;
}
