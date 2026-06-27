"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Zap, ShieldAlert, Radio, Loader2, ArrowLeft, Volume2 } from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Timeline } from "@/components/dashboard/Timeline";
import { VoiceConsole } from "@/components/dashboard/VoiceConsole";
import { RescueOverlay } from "@/components/dashboard/RescueOverlay";
import { AddTaskDialog } from "@/components/dashboard/AddTaskDialog";
import { useVoice } from "@/lib/useVoice";
import { formatDuration } from "@/lib/risk";
import type { AgentAction, IntegrationStatus, PlanBlock, RescueResult, RiskAssessment, Task } from "@/lib/types";

interface Data {
  tasks: Task[];
  assessments: RiskAssessment[];
  blocks: PlanBlock[];
  actions: AgentAction[];
}

export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [rescue, setRescue] = useState<RescueResult | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { speak, speaking } = useVoice();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    setData(await res.json());
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  async function runAgent() {
    setRunning(true);
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const result = await res.json();
      await refresh();
      showToast(`Agent ran · ${result.blocks.length} blocks booked`);
      if (result.briefing) speak(result.briefing);
    } finally {
      setRunning(false);
    }
  }

  async function triggerRescue() {
    setRunning(true);
    try {
      const res = await fetch("/api/agent/rescue", { method: "POST" });
      const result: RescueResult = await res.json();
      setRescue(result);
      await refresh();
      if (result.briefing) speak(result.briefing);
    } finally {
      setRunning(false);
    }
  }

  async function briefMe() {
    const res = await fetch("/api/voice/brief", { method: "POST" });
    const { text } = await res.json();
    showToast(text);
    speak(text);
  }

  async function addTask(input: { title: string; deadline?: string; estimatedMinutes?: number }) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    await refresh();
    showToast("Task added — Saarthi is scoring its risk");
  }

  async function updateProgress(id: string, progress: number) {
    // optimistic
    setData((d) =>
      d ? { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, progress, status: progress >= 100 ? "done" : "in_progress" } : t)) } : d
    );
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
    refresh();
  }

  const sendChat = useCallback(
    async (text: string): Promise<string> => {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const result = await res.json();
      await refresh();
      if (result.rescue) setRescue(result.rescue);
      return result.reply ?? "Done.";
    },
    [refresh]
  );

  const assessmentFor = useMemo(() => {
    const map = new Map<string, RiskAssessment>();
    data?.assessments.forEach((a) => map.set(a.taskId, a));
    return map;
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return null;
    const open = data.tasks.filter((t) => t.status !== "done");
    const atRisk = data.assessments.filter((a) => a.tier !== "calm").length;
    const next = data.assessments
      .filter((a) => {
        const t = data.tasks.find((x) => x.id === a.taskId);
        return t && t.status !== "done" && a.minutesToDeadline > 0;
      })
      .sort((a, b) => a.minutesToDeadline - b.minutesToDeadline)[0];
    return { open: open.length, atRisk, next: next ? formatDuration(next.minutesToDeadline) : "—", blocks: data.blocks.length };
  }, [data]);

  const sortedTasks = useMemo(() => {
    if (!data) return [];
    return [...data.tasks].sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (b.status === "done" && a.status !== "done") return -1;
      return (assessmentFor.get(b.id)?.score ?? 0) - (assessmentFor.get(a.id)?.score ?? 0);
    });
  }, [data, assessmentFor]);

  return (
    <div className="bg-mesh min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted transition-colors hover:text-fg" aria-label="Home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Logo />
            {status && <StatusChips status={status} />}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={briefMe} className="hidden items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-2 sm:inline-flex">
              <Volume2 className={`h-4 w-4 ${speaking ? "animate-pulse text-saffron" : ""}`} /> Brief me
            </button>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-2">
              <Plus className="h-4 w-4" /> Add
            </button>
            <button
              onClick={triggerRescue}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-3.5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
            >
              <ShieldAlert className="h-4 w-4" /> Rescue
            </button>
            <button
              onClick={runAgent}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-full brand-bg px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Run agent
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Open tasks" value={stats?.open ?? "—"} />
          <Stat label="At risk" value={stats?.atRisk ?? "—"} tone={stats && stats.atRisk > 0 ? "risk" : "calm"} />
          <Stat label="Next deadline" value={stats?.next ?? "—"} mono />
          <Stat label="Blocks booked" value={stats?.blocks ?? "—"} />
        </div>

        {/* Bento */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Mission */}
          <section className="glass rounded-3xl p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Today&apos;s mission</h2>
              <span className="text-xs text-muted">sorted by risk</span>
            </div>
            <div className="space-y-3">
              {!data && <SkeletonList />}
              <AnimatePresence>
                {sortedTasks.map((t) => (
                  <TaskCard key={t.id} task={t} assessment={assessmentFor.get(t.id)} onProgress={updateProgress} />
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Voice console */}
          <section className="glass rounded-3xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <LogoMark className="h-6 w-6" />
              <h2 className="font-display text-lg font-bold">Talk to Saarthi</h2>
            </div>
            <VoiceConsole onSend={sendChat} />
          </section>

          {/* Activity feed */}
          <section className="glass rounded-3xl p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Agent activity</h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-calm">
                <Radio className="h-3.5 w-3.5" /> autonomous
              </span>
            </div>
            <ActivityFeed actions={data?.actions ?? []} />
          </section>

          {/* Timeline */}
          <section className="glass rounded-3xl p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Today&apos;s plan</h2>
            <Timeline blocks={data?.blocks ?? []} />
          </section>
        </div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {rescue && (
          <RescueOverlay
            result={rescue}
            speaking={speaking}
            onReplay={() => speak(rescue.briefing)}
            onClose={() => setRescue(null)}
          />
        )}
        {showAdd && <AddTaskDialog onClose={() => setShowAdd(false)} onAdd={addTask} />}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 left-1/2 z-40 max-w-md -translate-x-1/2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-card"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusChips({ status }: { status: IntegrationStatus }) {
  const chips = [
    { k: "Gemini", live: status.gemini },
    { k: "Sarvam", live: status.sarvam },
    { k: "Google", live: status.google },
  ];
  return (
    <div className="hidden items-center gap-1.5 md:flex">
      {chips.map((c) => (
        <span
          key={c.k}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            c.live ? "bg-calm/12 text-calm" : "bg-surface-2 text-muted"
          }`}
          title={c.live ? `${c.k} is live` : `${c.k} in demo mode`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${c.live ? "bg-calm" : "bg-muted/50"}`} />
          {c.k}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value, tone, mono }: { label: string; value: string | number; tone?: "risk" | "calm"; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${mono ? "font-mono tabular" : ""} ${tone === "risk" ? "text-risk" : tone === "calm" ? "text-calm" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl border border-line bg-surface-2/40" />
      ))}
    </div>
  );
}
