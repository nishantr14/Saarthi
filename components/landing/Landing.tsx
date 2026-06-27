"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Radar,
  Brain,
  CalendarCheck,
  RefreshCw,
  ShieldAlert,
  Languages,
  Activity,
  Sparkles,
  Mic,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

export function Landing() {
  return (
    <main className="bg-mesh min-h-dvh">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#how" className="transition-colors hover:text-fg">How it works</a>
            <a href="#features" className="transition-colors hover:text-fg">Features</a>
            <a href="#stack" className="transition-colors hover:text-fg">Tech</a>
          </nav>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-1.5 rounded-full brand-bg px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Open command center
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-16 pb-12 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs text-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-calm animate-pulse" />
              Coding Ninjas × Google for Developers · Vibe2Ship
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="show"
              custom={1}
              variants={fadeUp}
              className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
            >
              The AI that <span className="brand-text">drives you</span> to the finish line.
            </motion.h1>

            <motion.p initial="hidden" animate="show" custom={2} variants={fadeUp} className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Saarthi doesn&apos;t just remind you. It plans your deadlines, books your focus time on your real calendar,
              drafts the work, and <span className="text-fg font-medium">rescues you</span> when you&apos;re cutting it close —
              all by voice, in your language.
            </motion.p>

            <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full brand-bg px-6 py-3 font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Launch Saarthi
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-6 py-3 font-medium text-fg transition-colors hover:bg-surface-2">
                See how it works
              </a>
            </motion.div>

            <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5"><Brain className="h-4 w-4 text-brand" /> Gemini brain</span>
              <span className="inline-flex items-center gap-1.5"><Mic className="h-4 w-4 text-saffron" /> Sarvam voice</span>
              <span className="inline-flex items-center gap-1.5"><CalendarCheck className="h-4 w-4 text-calm" /> Real Calendar + Gmail</span>
            </motion.div>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* Problem strip */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="glass rounded-3xl p-7 md:p-10">
          <p className="text-center font-display text-2xl font-bold leading-snug md:text-3xl">
            Reminders are passive. <span className="text-muted">They ping and hope.</span>
            <br className="hidden md:block" /> Saarthi is an <span className="brand-text">autonomous agent</span> that does the prep,
            books the time, and drags you across the line.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-14">
        <SectionHeading kicker="The loop" title="A continuous agent, not a to-do list" subtitle="Saarthi runs Sense → Think → Act → Reflect on every deadline, around the clock." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              custom={i}
              variants={fadeUp}
              className="group relative rounded-2xl border border-line bg-surface/50 p-6 transition-colors hover:border-brand/50"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl brand-bg text-white shadow-glow">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mb-1 font-mono text-xs text-muted">0{i + 1}</div>
              <h3 className="font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-14">
        <SectionHeading kicker="Why it wins" title="The moments judges remember" subtitle="Built around 60% of the scoreboard: agentic depth, innovation, and impact." />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Feature
            className="md:col-span-2"
            icon={ShieldAlert}
            tone="danger"
            title="Rescue Mode"
            body="One tap when you're panicking. Saarthi triages every deadline, tells you exactly what to do in the next 2 hours — and has already written the drafts and blocked the time. It narrates the plan out loud so you can just go."
          />
          <Feature
            icon={Languages}
            tone="saffron"
            title="Talk in Hinglish"
            body="“kal ka assignment abhi tak start nahi kiya” — understood, planned, and answered by voice. Powered by Sarvam saaras + bulbul."
          />
          <Feature
            icon={Activity}
            tone="brand"
            title="Live escalation engine"
            body="Every task carries a risk score. Watch it climb — and watch Saarthi decide, on its own, when a gentle nudge becomes “I've drafted it for you.”"
          />
          <Feature
            className="md:col-span-2"
            icon={Sparkles}
            tone="calm"
            title="A transparent agent feed"
            body="No black box. Every autonomous decision is logged: “Booked 2:00–3:30 focus block”, “Drafted reply to the client”, “Re-planned — you fell behind on DBMS.” You always see what your agent did and why."
          />
        </div>
      </section>

      {/* Tech strip */}
      <section id="stack" className="mx-auto max-w-6xl px-5 py-14">
        <SectionHeading kicker="Built on" title="A clean division of labor" subtitle="Sarvam is the ears and mouth. Gemini is the brain. Google Cloud is the hands and body." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STACK.map((s) => (
            <div key={s.name} className="rounded-2xl border border-line bg-surface/50 p-5">
              <div className="text-sm font-semibold">{s.name}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted">{s.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-line brand-bg p-10 text-center md:p-14">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(40rem 20rem at 50% -20%, white, transparent)" }} />
          <h2 className="relative font-display text-3xl font-extrabold text-white md:text-4xl">Stop missing deadlines you could&apos;ve beaten.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/85">Let Saarthi take the reins. Plan, draft, and rescue — by voice.</p>
          <Link href="/dashboard" className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-[hsl(256_60%_30%)] transition-transform hover:-translate-y-0.5">
            Open the command center <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 text-sm text-muted md:flex-row">
          <Logo />
          <p>Built for Vibe2Ship · Gemini · Sarvam AI · Google Cloud</p>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="max-w-2xl">
      <div className="mb-2 font-mono text-xs uppercase tracking-widest text-brand">{kicker}</div>
      <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-3 text-muted">{subtitle}</p>
    </motion.div>
  );
}

const toneMap = {
  brand: "text-brand bg-brand/10",
  saffron: "text-saffron bg-saffron/10",
  calm: "text-calm bg-calm/10",
  danger: "text-danger bg-danger/10",
} as const;

function Feature({
  icon: Icon,
  title,
  body,
  tone,
  className = "",
}: {
  icon: typeof ShieldAlert;
  title: string;
  body: string;
  tone: keyof typeof toneMap;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      className={`rounded-2xl border border-line bg-surface/50 p-6 transition-colors hover:border-brand/40 ${className}`}
    >
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${toneMap[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </motion.div>
  );
}

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="glass rounded-3xl p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark className="h-6 w-6" />
            <span className="text-sm font-semibold">Agent activity</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-calm/10 px-2.5 py-1 text-xs text-calm">
            <span className="h-1.5 w-1.5 rounded-full bg-calm animate-pulse" /> live
          </span>
        </div>
        <div className="space-y-2.5">
          {FEED.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.18 }}
              className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/60 p-3"
            >
              <div className={`mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg ${toneMap[f.tone]}`}>
                <f.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{f.title}</div>
                <div className="truncate text-xs text-muted">{f.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-danger/30 bg-danger/10 p-3">
          <div className="text-sm">
            <span className="font-semibold text-danger">DBMS assignment</span>
            <span className="text-muted"> · 2h 20m left</span>
          </div>
          <span className="rounded-full bg-danger px-2.5 py-1 font-mono text-xs font-bold text-white">RISK 92</span>
        </div>
      </div>
    </motion.div>
  );
}

const LOOP = [
  { icon: Radar, title: "Sense", body: "Pulls tasks from your voice, text, calendar and inbox — in any language." },
  { icon: Brain, title: "Think", body: "Gemini decomposes each task, estimates effort, and scores deadline risk." },
  { icon: CalendarCheck, title: "Act", body: "Books focus blocks on your real calendar and drafts the actual work." },
  { icon: RefreshCw, title: "Reflect", body: "Falling behind? It re-plans on its own and escalates how hard it helps." },
];

const FEED = [
  { icon: CalendarCheck, tone: "calm" as const, title: "Booked 2:00–3:30 focus block", sub: "DBMS assignment · on your calendar" },
  { icon: Brain, tone: "brand" as const, title: "Drafted reply to Lighthouse client", sub: "Q2 invoice · ready to review" },
  { icon: RefreshCw, tone: "saffron" as const, title: "Re-planned your evening", sub: "You fell behind — shifted 2 blocks" },
];

const STACK = [
  { name: "Gemini", role: "Planning, decomposition, drafting & chat" },
  { name: "Sarvam AI", role: "saaras (STT) + bulbul (TTS) voice layer" },
  { name: "Google Calendar", role: "Books real focus blocks" },
  { name: "Gmail", role: "Drafts emails you just review & send" },
  { name: "Cloud Run", role: "Hosts the whole app, one container" },
];
