"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

export function AddTaskDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (input: { title: string; deadline?: string; estimatedMinutes?: number }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimate, setEstimate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim() || busy) return;
    setBusy(true);
    await onAdd({
      title: title.trim(),
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      estimatedMinutes: estimate ? Number(estimate) : undefined,
    });
    setBusy(false);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,4,10,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Add a task</h2>
          <button onClick={onClose} className="text-muted hover:text-fg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-muted">What needs doing?</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Submit OS lab report"
          className="mb-4 h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm outline-none focus:border-brand"
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Estimate (min)</label>
            <input
              type="number"
              min={5}
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              placeholder="auto"
              className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        <p className="mb-4 text-xs text-muted">Saarthi will auto-break this into subtasks and start scoring its risk.</p>

        <button
          onClick={submit}
          disabled={!title.trim() || busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl brand-bg py-3 font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Add & let Saarthi plan it
        </button>
      </motion.div>
    </motion.div>
  );
}
