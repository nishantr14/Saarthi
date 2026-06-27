"use client";

import { CalendarCheck } from "lucide-react";
import type { PlanBlock } from "@/lib/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function Timeline({ blocks }: { blocks: PlanBlock[] }) {
  const sorted = [...blocks].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  if (sorted.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No focus blocks yet. The agent will schedule your time when you run it.</p>;
  }
  return (
    <div className="relative space-y-3 pl-5">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-line" />
      {sorted.map((b) => (
        <div key={b.id} className="relative">
          <span className="absolute -left-5 top-1.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-brand bg-bg" />
          <div className="rounded-xl border border-line bg-surface-2/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="tabular font-mono text-xs text-brand">
                {fmt(b.start)} – {fmt(b.end)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <CalendarCheck className="h-3 w-3" />
                {b.simulated ? "demo" : "on calendar"}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium">{b.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
