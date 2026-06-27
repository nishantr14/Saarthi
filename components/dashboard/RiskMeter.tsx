"use client";

import type { RiskTier } from "@/lib/types";

export const TIER_CLASS: Record<RiskTier, { text: string; bg: string; ring: string; label: string }> = {
  calm: { text: "text-calm", bg: "bg-calm/12", ring: "hsl(152 62% 45%)", label: "On track" },
  nudge: { text: "text-risk", bg: "bg-risk/12", ring: "hsl(38 95% 55%)", label: "At risk" },
  act: { text: "text-saffron", bg: "bg-saffron/12", ring: "hsl(32 96% 56%)", label: "Acting" },
  rescue: { text: "text-danger", bg: "bg-danger/12", ring: "hsl(0 84% 62%)", label: "Rescue" },
};

export function RiskRing({ score, tier, size = 52 }: { score: number; tier: RiskTier; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = TIER_CLASS[tier].ring;
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(240 14% 22%)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 600ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="tabular font-mono text-sm font-bold">{score}</span>
      </div>
    </div>
  );
}

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const t = TIER_CLASS[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.bg} ${t.text}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.ring }} />
      {t.label}
    </span>
  );
}
