# Saarthi — Vibe2Ship Submission (Project Description)

> Copy this into a Google Doc, set sharing to **"Anyone with the link"**, and submit the link
> alongside the **Cloud Run URL** and the **GitHub repo** on the BlockseBlock platform.

**Live app (Cloud Run):** https://saarthi-143887443744.asia-south1.run.app
**GitHub:** https://github.com/nishantr14/Saarthi
**Architecture diagram:** see `docs/architecture.svg` in the repo (embed it here).

---

## Problem Statement Selected

**Problem Statement 1 — The Last-Minute Life Saver.**
An AI-powered productivity companion that *proactively* helps users plan, prioritize, and complete tasks **before** deadlines are missed — moving beyond passive reminders to help users actually take action.

## Solution Overview

**Saarthi** (Sanskrit: *the charioteer who guides you to victory*) is an **autonomous AI chief-of-staff**. Instead of pinging you with reminders you ignore, it runs a continuous agentic loop — **Sense → Think → Act → Reflect** — and *takes real action on your behalf*:

- It **senses** your commitments from voice (in any Indian language / Hinglish), text, your Google Calendar and Gmail.
- It **thinks** with Gemini: decomposing each task into subtasks, estimating effort, and computing a live **deadline-risk score**.
- It **acts** autonomously: booking focus blocks on your **real Google Calendar**, drafting the actual **email/work** in **Gmail**, and escalating **voice nudges** through Sarvam AI.
- It **reflects**: when you fall behind, it **re-plans on its own** and escalates how hard it intervenes.

Under the hood, the "think + act" stage is a **real Gemini function-calling agent swarm**: a **Planner** decides which tools to invoke, and specialized agents — **Sentinel** (risk scoring), **Scheduler** (calendar), **Drafter** (Gmail), **Voice** (Sarvam nudges) — execute them, with every decision captured in a transparent reasoning trace. A deterministic safety-net guarantees no at-risk task is ever left unhandled.

The signature experience is **Rescue Mode**: one tap when you're out of time, and Saarthi triages everything, narrates a 2-hour survival plan out loud, and has *already* drafted the work and blocked the time.

It is also **genuinely proactive**: a **Cloud Scheduler** job runs the swarm autonomously every 30 minutes and pushes **voice + Telegram nudges** — so Saarthi acts even when the app is closed, directly answering the problem statement's core complaint that "passive reminders are easy to ignore."

## Key Features

1. **Gemini function-calling agent swarm** — a Planner agent calls real tools; Sentinel/Scheduler/Drafter/Voice agents execute, with a visible step-by-step **reasoning trace**.
2. **Autonomous Sense→Think→Act→Reflect loop** — not a to-do list; a continuously-acting agent, with a deterministic safety-net so it's reliable *and* intelligent.
3. **Live escalation engine** — every task carries a 0–100 risk score mapping to a tier (`calm → nudge → act → rescue`); the agent decides *on its own* when and how hard to intervene.
4. **Real-world actions** — books focus blocks on Google Calendar and creates Gmail drafts you just review & send.
5. **Proactive by design** — Cloud Scheduler runs the swarm every 30 min and sends **Telegram + voice nudges**, even with the app closed.
6. **Rescue Mode** — instant triage + spoken 2-hour plan + pre-done prep when you're panicking.
7. **Voice-first, India-first** — talk to it in Hinglish ("*kal ka assignment abhi tak start nahi kiya, bach lo*") via Sarvam `saaras` (STT); hear it reply via Sarvam `bulbul` (TTS).
8. **Transparent agent activity feed** — every autonomous decision logged; no black box.
9. **AI task decomposition** — new tasks auto-split into estimated subtasks and categorized by Gemini.
10. **Graceful degradation** — runs fully even with no API keys, so the live link never breaks.

## Technologies Used

- **Frontend/Full-stack:** Next.js 14 (App Router, TypeScript), React 18, Tailwind CSS, Framer Motion, Lucide icons.
- **Backend:** Next.js Route Handlers (Node runtime).
- **AI brain:** `@google/generative-ai` (Gemini).
- **Voice:** Sarvam AI REST — `saaras:v3` (speech-to-text, code-mix) + `bulbul:v3` (text-to-speech).
- **Actions:** `googleapis` — Google Calendar + Gmail.
- **Packaging/Deploy:** Docker (Next.js standalone) → Google Cloud Run.

## Google Technologies Utilized

- **Gemini API (function-calling)** — the agent swarm's Planner + tool execution, task decomposition, drafting, and conversational agent (`gemini-2.5-flash-lite`).
- **Google Cloud Run** — hosts the deployed application (mandatory deployment target).
- **Google Cloud Scheduler** — triggers the autonomous proactive runs.
- **Google Calendar API** — autonomously books real focus blocks.
- **Gmail API** — drafts emails the user reviews and sends.
- **Cloud Build** — builds the container from source on deploy.
- **Google Fonts** — Sora / Inter / JetBrains Mono.
- *(Firestore-ready storage interface for production persistence.)*

---

## How it maps to the Evaluation Matrix

| Criteria | Weight | How Saarthi scores |
|---|---|---|
| Problem Solving & Impact | 20% | Attacks the real, universal pain of missed deadlines with proactive action, not reminders. |
| **Agentic Depth** | **20%** | A real **Gemini function-calling swarm** (Planner + 4 specialized agents) with a visible reasoning trace, real tool use (calendar/Gmail), and a Cloud Scheduler proactive loop. |
| Innovation & Creativity | 20% | Rescue Mode + voice-first Hinglish + a live risk-escalation engine. |
| Usage of Google Technologies | 15% | Gemini + Calendar + Gmail + Cloud Run + Cloud Build + Fonts. |
| Product Experience & Design | 10% | Premium command-center UI, accessible, animated, responsive. |
| Technical Implementation | 10% | Clean module boundaries, typed end-to-end, graceful fallbacks, containerized. |
| Completeness & Usability | 5% | Works end-to-end out of the box; live link never breaks. |

## 90-second demo script

1. Open the **landing page** → "Launch Saarthi".
2. **Dashboard**: point out the risk scores — DBMS assignment is glowing red at **98 (Rescue)**.
3. Hit **"Run agent"** → the **Agent Swarm trace** pops up showing Gemini's function-calling decisions (Sentinel → Scheduler → Drafter → Voice → Planner), then the activity feed fills and Saarthi narrates the summary aloud.
4. In **Talk to Saarthi**, type/say **"yaar kal ka assignment abhi tak start nahi kiya, bach lo"** → it detects panic and triggers **Rescue Mode**.
5. **Rescue overlay**: a spoken 2-hour plan with each item already *prepped*. "Start with #1 — go."
6. Add a task by voice → it auto-decomposes into subtasks and starts scoring its risk.

> Tip for the live judging link: keep `DEMO_MODE` working so the demo is rock-solid even if a third-party key rate-limits.
