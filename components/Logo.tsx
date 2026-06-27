export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Saarthi logo" fill="none">
      <defs>
        <linearGradient id="saarthi-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(256 90% 66%)" />
          <stop offset="1" stopColor="hsl(32 96% 56%)" />
        </linearGradient>
      </defs>
      {/* chariot wheel — the saarthi motif */}
      <circle cx="24" cy="24" r="15" stroke="url(#saarthi-grad)" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="3.2" fill="url(#saarthi-grad)" />
      {[0, 45, 90, 135].map((a) => (
        <line
          key={a}
          x1="24"
          y1="24"
          x2={24 + 15 * Math.cos((a * Math.PI) / 180)}
          y2={24 + 15 * Math.sin((a * Math.PI) / 180)}
          stroke="url(#saarthi-grad)"
          strokeWidth="1.6"
          opacity="0.55"
        />
      ))}
      {/* forward motion arrow */}
      <path d="M30 16l6 8-6 8" stroke="url(#saarthi-grad)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">
        Saarthi
      </span>
    </span>
  );
}
