# Saarthi — Vibe2Ship Submission (Project Description)

> Copy this into a Google Doc, set sharing to **"Anyone with the link"**, and submit the link
> alongside the **Cloud Run URL** and the **GitHub repo** on the BlockseBlock platform.

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

The signature experience is **Rescue Mode**: one tap when you're out of time, and Saarthi triages everything, narrates a 2-hour survival plan out loud, and has *already* drafted the work and blocked the time.

## Key Features

1. **Autonomous Sense→Think→Act→Reflect agent loop** — not a to-do list; a continuously-acting agent.
2. **Live escalation engine** — every task carries a 0–100 risk score that maps to a tier (`calm → nudge → act → rescue`); the agent decides *on its own* when to step in and how hard.
3. **Real-world actions** — books focus blocks on Google Calendar and creates Gmail drafts you just review & send.
4. **Rescue Mode** — instant triage + spoken 2-hour plan + pre-done prep when you're panicking.
5. **Voice-first, India-first** — talk to it in Hinglish ("*kal ka assignment abhi tak start nahi kiya, bach lo*") via Sarvam `saaras` (STT) and hear it reply via Sarvam `bulbul` (TTS).
6. **Transparent agent activity feed** — every autonomous decision is logged; no black box.
7. **AI task decomposition** — new tasks are auto-split into estimated subtasks and categorized by Gemini.
8. **Graceful degradation** — runs fully even with no API keys (demo mode), so the live link never breaks.

## Technologies Used

- **Frontend/Full-stack:** Next.js 14 (App Router, TypeScript), React 18, Tailwind CSS, Framer Motion, Lucide icons.
- **Backend:** Next.js Route Handlers (Node runtime).
- **AI brain:** `@google/generative-ai` (Gemini).
- **Voice:** Sarvam AI REST — `saaras:v3` (speech-to-text, code-mix) + `bulbul:v3` (text-to-speech).
- **Actions:** `googleapis` — Google Calendar + Gmail.
- **Packaging/Deploy:** Docker (Next.js standalone) → Google Cloud Run.

## Google Technologies Utilized

- **Gemini API** — planning, task decomposition, drafting, and conversational agent.
- **Google Cloud Run** — hosts the deployed application (mandatory deployment target).
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
| **Agentic Depth** | **20%** | A genuine autonomous Sense→Think→Act→Reflect loop that books calendar slots, drafts emails, and re-plans on its own. |
| Innovation & Creativity | 20% | Rescue Mode + voice-first Hinglish + a live risk-escalation engine. |
| Usage of Google Technologies | 15% | Gemini + Calendar + Gmail + Cloud Run + Cloud Build + Fonts. |
| Product Experience & Design | 10% | Premium command-center UI, accessible, animated, responsive. |
| Technical Implementation | 10% | Clean module boundaries, typed end-to-end, graceful fallbacks, containerized. |
| Completeness & Usability | 5% | Works end-to-end out of the box; live link never breaks. |

## 90-second demo script

1. Open the **landing page** → "Launch Saarthi".
2. **Dashboard**: point out the risk scores — DBMS assignment is glowing red at **98 (Rescue)**.
3. Hit **"Run agent"** → watch the activity feed fill: *booked a focus block*, *took over the DBMS deadline*, *drafted the client invoice email*, *nudged the electricity bill*. Saarthi narrates the summary aloud.
4. In **Talk to Saarthi**, type/say **"yaar kal ka assignment abhi tak start nahi kiya, bach lo"** → it detects panic and triggers **Rescue Mode**.
5. **Rescue overlay**: a spoken 2-hour plan with each item already *prepped*. "Start with #1 — go."
6. Add a task by voice → it auto-decomposes into subtasks and starts scoring its risk.

> Tip for the live judging link: keep `DEMO_MODE` working so the demo is rock-solid even if a third-party key rate-limits.
