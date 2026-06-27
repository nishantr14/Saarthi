# Saarthi — Design Spec

> *Saarthi (सारथी) — the charioteer who guides you to victory. An autonomous AI chief-of-staff that drives you across the finish line before deadlines slip.*

**Hackathon:** Coding Ninjas × Google for Developers — Vibe2Ship
**Problem Statement 1:** *The Last-Minute Life Saver* — an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed.
**Deadline:** 30 June 2026, 11:59 PM. Must deploy on Google Cloud.

## 1. Winning thesis

The evaluation matrix rewards **Agentic Depth (20%) + Innovation (20%) + Problem Solving (20%) = 60%**. Most teams will ship a prettier to-do list with reminders. Saarthi wins by being a **proactive autonomous agent** that *takes real action* — not a passive reminder app — wrapped in a **voice-first, India-first** experience.

The one-line pitch: **"It doesn't remind you to do the work. It does the prep, books the time, and drags you across the line."**

## 2. Role split (every scoring box gets fed)

| Layer | Responsibility | Technology | Scores |
|---|---|---|---|
| 👂 Ears | Capture voice brain-dumps & commands in any Indian language / Hinglish | **Sarvam `saaras:v3`** (STT, translate mode) | Innovation |
| 🧠 Brain | Plan, decompose, prioritize, decide, re-plan, draft | **Gemini** (function-calling agent) | Agentic Depth + Google Tech |
| ✋ Hands | Real actions: book calendar slots, draft emails | **Google Calendar API + Gmail API** | Agentic Depth + Google Tech |
| 🗣️ Voice | Proactive nudges, daily briefing, Rescue narration | **Sarvam `bulbul:v3`** (TTS) | Innovation |
| 🧬 Memory + Body | Persist state, host the app | **Firestore (prod) / Cloud Run** | Google Tech (mandatory) |

Sarvam = *ears + mouth*. Gemini = *brain*. Google Cloud = *hands + body*. Sarvam never cannibalizes the 15% Google-tech score.

## 3. The agentic loop (this is the core)

Saarthi runs a continuous **Sense → Think → Act → Reflect** loop. This is what earns Agentic Depth.

1. **SENSE** — Ingest tasks (voice via Sarvam STT, text, or quick-add). Read Google Calendar (busy slots) and Gmail (deadline signals).
2. **THINK** — Gemini decomposes each task into subtasks, estimates effort, computes a **deadline risk score**, and produces a prioritized, time-blocked plan that fits around existing commitments.
3. **ACT** — *Autonomously*, based on risk thresholds: book focus blocks on the **real Google Calendar**, draft the **actual email / first draft** in Gmail, and emit escalating **voice nudges** (Sarvam TTS).
4. **REFLECT** — Monitor progress. If the user falls behind, **re-plan automatically**: reshuffle remaining blocks, raise urgency, and escalate the intervention tier.

### Escalation engine
Each task carries a live **risk score** (0–100) from `lib/risk.ts`, derived from: time-to-deadline, estimated effort remaining, progress %, and number of conflicts. Risk maps to a **tier** that decides how hard the agent intervenes:

| Tier | Risk | Agent behaviour |
|---|---|---|
| `calm` | 0–39 | Silent. Plan is on track. |
| `nudge` | 40–64 | Gentle voice nudge + suggest a focus block. |
| `act` | 65–84 | Auto-book a focus block, draft a starting point, voice nudge. |
| `rescue` | 85–100 | Take over: triage, draft everything, narrate a 2-hour survival plan. |

## 4. Wow features (what judges remember)

- 🚨 **Rescue Mode** — one tap when panicking. Agent triages every task, tells you exactly what to do in the next 2 hours, and *has already done the prep* (drafts written, slots booked). Narrated by Sarvam voice.
- 🗣️ **Talk in Hinglish** — "kal ka assignment abhi tak start nahi kiya" → understood, planned, replied in voice.
- 📈 **Live escalation** — watch each task's risk score climb and the agent autonomously decide when to step in.
- 🤖 **Agent activity feed** — a transparent log of every autonomous decision and action the agent took ("Booked 2pm–3:30pm focus block", "Drafted reply to prof", "Re-planned: you fell behind on DBMS").

## 5. Architecture

Single **Next.js 14 (App Router, TypeScript)** full-stack app → one container → **Cloud Run**.

```
app/
  page.tsx                 Landing (operations pattern: hero + live preview + how-it-works + CTA)
  dashboard/page.tsx       Command center (bento grid)
  api/
    tasks/route.ts         GET/POST tasks
    tasks/[id]/route.ts    PATCH progress/status
    agent/plan/route.ts    Run planner (Think)
    agent/run/route.ts     Run autonomous loop (Sense→Think→Act→Reflect)
    agent/rescue/route.ts  Rescue Mode triage
    agent/chat/route.ts    Conversational agent
    voice/tts/route.ts     Sarvam TTS
    voice/stt/route.ts     Sarvam STT
    voice/brief/route.ts   Spoken daily briefing
lib/
  types.ts     Domain model
  store.ts     Storage interface + in-memory seeded impl (Firestore adapter for prod)
  risk.ts      Deadline risk scoring + tier mapping
  gemini.ts    Gemini brain + deterministic heuristic fallback
  sarvam.ts    Sarvam TTS/STT clients + fallback
  google.ts    Calendar + Gmail actions + simulate fallback
  agent.ts     The Sense→Think→Act→Reflect orchestrator
```

### Graceful degradation (critical for an always-working demo)
The deployed link must work for judges **even before secrets are wired**. Every external integration has a fallback:
- **No Gemini key** → deterministic heuristic planner (still decomposes, prioritizes, time-blocks).
- **No Sarvam key** → browser Web Speech API for STT, and TTS endpoint returns a flag so the client speaks via `speechSynthesis`.
- **No Google OAuth** → actions are *simulated* and recorded in the activity feed as "(demo) would book…".

A `DEMO_MODE` banner makes this honest and obvious. With real keys set, the same code paths become fully live.

## 6. Data model (summary)

`Task { id, title, description, deadline, estimatedMinutes, progress, status, subtasks[], category, source }`
`Subtask { id, title, done, estimatedMinutes }`
`PlanBlock { id, taskId, start, end, label, booked }`
`AgentAction { id, ts, type, summary, taskId?, tier }` — feeds the activity log
`RiskAssessment { taskId, score, tier, reasons[] }`

## 7. Visual design

- **Pattern:** Real-time / operations command center (from ui-ux-pro-max design system).
- **Mode:** Dark-first, premium, glassmorphic surfaces, micro-interactions.
- **Brand:** Violet → Saffron gradient (intelligence → India / urgency).
- **Status colors:** green (calm) / amber (at risk) / red (critical) — drive the risk UI.
- **Type:** Sora (display) · Inter (body) · JetBrains Mono (timers, risk numbers).
- **Motion:** 150–300ms micro-interactions, spring physics, `prefers-reduced-motion` respected.
- **A11y:** 4.5:1 contrast, focus rings, keyboard nav, SVG (Lucide) icons — no emoji as structural icons.

## 8. Google technologies used

Gemini API · Google Calendar API · Gmail API · Cloud Run (deploy) · Firestore (prod persistence) · Google Fonts. Optionally Google AI Studio for prompt iteration.

## 9. Out of scope (YAGNI for the deadline)

Multi-user auth/teams, mobile native app, real push notifications, billing. Single-user demo with seeded realistic data + live add. Firestore wired behind the store interface but in-memory is the default so the demo never breaks.
