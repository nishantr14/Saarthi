<div align="center">

# 🏇 Saarthi

### The AI that drives you to the finish line.

An autonomous AI **chief-of-staff** that proactively plans, prioritizes, books your time, drafts your work, and **rescues you** before deadlines slip — voice-first, India-first.

**Built for Coding Ninjas × Google for Developers — Vibe2Ship · Problem Statement 1: _The Last-Minute Life Saver_**

`Gemini` · `Sarvam AI` · `Google Calendar + Gmail` · `Cloud Run` · `Next.js 14`

</div>

---

## Why it's different

Most productivity tools send **passive reminders** that are easy to ignore. Saarthi is an **autonomous agent** that runs a continuous loop and *takes real action*:

> **Sense → Think → Act → Reflect**

1. **Sense** — ingests tasks from voice (any Indian language / Hinglish), text, your Google Calendar and Gmail.
2. **Think** — Gemini decomposes each task, estimates effort, and computes a live **deadline-risk score**.
3. **Act** — *autonomously* books focus blocks on your **real Google Calendar**, drafts the actual **email/work** in Gmail, and sends escalating **voice nudges** (Sarvam).
4. **Reflect** — if you fall behind it **re-plans on its own** and escalates how hard it helps.

### The moments that win
- 🚨 **Rescue Mode** — one tap when you're panicking. Saarthi triages everything, narrates a 2-hour survival plan, and has *already* drafted the work and blocked the time.
- 🗣️ **Talk in Hinglish** — *"kal ka assignment abhi tak start nahi kiya, bach lo"* → understood, triaged, answered by voice.
- 📈 **Live escalation engine** — every task carries a risk score; the agent decides on its own when a gentle nudge becomes *"I've drafted it for you."*
- 🤖 **Transparent agent feed** — every autonomous decision is logged. No black box.

## Architecture — a clean division of labor

| Layer | Does | Tech |
|---|---|---|
| 👂 Ears | Capture voice in any language | **Sarvam `saaras:v3`** (STT) |
| 🧠 Brain | Plan, decompose, prioritize, draft, chat | **Gemini** |
| ✋ Hands | Book calendar slots, draft emails | **Google Calendar + Gmail APIs** |
| 🗣️ Voice | Nudges, briefings, Rescue narration | **Sarvam `bulbul:v3`** (TTS) |
| 🧬 Body | Host the app | **Google Cloud Run** |

> One Next.js full-stack app → one container → Cloud Run.

## Runs with zero config (graceful degradation)

The app **works out of the box in DEMO_MODE** — no keys required — so the deployed link is always live:
- No **Gemini** key → deterministic heuristic planner (still decomposes, scores, schedules).
- No **Sarvam** key → browser Web Speech / `speechSynthesis` for voice.
- No **Google** OAuth → actions are *simulated* and shown in the feed as `(demo)`.

Add real keys (below) and the **same code paths become fully live** — no changes.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: add keys to go live
npm run dev                  # http://localhost:3000
```

## Deploy to Google Cloud Run (mandatory submission requirement)

### Option A — one command from source (no Docker needed)
```bash
gcloud run deploy saarthi \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=...,SARVAM_API_KEY=..."
```
Cloud Run builds the included `Dockerfile` with Cloud Build and gives you a public HTTPS URL.

### Option B — build, push, deploy
```bash
PROJECT=$(gcloud config get-value project)
gcloud builds submit --tag gcr.io/$PROJECT/saarthi
gcloud run deploy saarthi \
  --image gcr.io/$PROJECT/saarthi \
  --region asia-south1 --allow-unauthenticated
```

### Configure secrets (to go fully live)
Set these as Cloud Run env vars / Secret Manager entries:

| Var | Where to get it |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `SARVAM_API_KEY` | https://dashboard.sarvam.ai |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud → APIs & Services → Credentials (OAuth 2.0) |
| `GOOGLE_REFRESH_TOKEN` | One-time OAuth consent for Calendar + Gmail scopes |

Enable the **Calendar API** and **Gmail API** in your Google Cloud project.

> AI Studio note: you can also export/deploy via Google AI Studio per the hackathon docs; this repo is a standard container so it runs anywhere Cloud Run does.

## Tech stack

Next.js 14 (App Router, TypeScript) · Tailwind CSS · Framer Motion · Lucide · `@google/generative-ai` · `googleapis` · Sarvam REST · Docker (standalone) · Cloud Run.

## Project structure

```
app/            routes + API (tasks, agent/run|rescue|chat, voice/tts|stt|brief, status)
components/      landing + dashboard (TaskCard, RiskMeter, ActivityFeed, VoiceConsole, RescueOverlay)
lib/            agent.ts (the loop) · risk.ts · gemini.ts · sarvam.ts · google.ts · store.ts
docs/specs/     design spec
```

---

<div align="center">
Built with care for Vibe2Ship. Don't just get reminded — get driven across the line.
</div>
