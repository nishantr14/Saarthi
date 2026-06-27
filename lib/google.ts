import { google } from "googleapis";
import { env, hasGoogle } from "./config";

/**
 * The "hands" — real actions on the user's Google Calendar and Gmail.
 * Uses a stored OAuth2 refresh token. When credentials are absent, every
 * function returns `{ simulated: true }` so the agent can still show the
 * action it *would* take in the activity feed.
 */

function oauthClient() {
  const client = new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleRedirect);
  client.setCredentials({ refresh_token: env.googleRefreshToken });
  return client;
}

export interface CalendarResult {
  simulated: boolean;
  htmlLink?: string;
  id?: string;
}

/** Book a focus block on the primary calendar. */
export async function bookFocusBlock(args: {
  title: string;
  start: string; // ISO
  end: string; // ISO
}): Promise<CalendarResult> {
  if (!hasGoogle()) return { simulated: true };
  try {
    const calendar = google.calendar({ version: "v3", auth: oauthClient() });
    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `🏇 ${args.title}`,
        description: "Focus block scheduled by Saarthi to protect your deadline.",
        start: { dateTime: args.start },
        end: { dateTime: args.end },
        colorId: "6",
        reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 5 }] },
      },
    });
    return { simulated: false, htmlLink: res.data.htmlLink ?? undefined, id: res.data.id ?? undefined };
  } catch (e) {
    console.error("[google] calendar insert failed, simulating:", e);
    return { simulated: true };
  }
}

export interface DraftResult {
  simulated: boolean;
  id?: string;
}

/** Create a Gmail draft (never auto-sends — the user reviews and sends). */
export async function createGmailDraft(args: {
  to?: string;
  subject: string;
  body: string;
}): Promise<DraftResult> {
  if (!hasGoogle()) return { simulated: true };
  try {
    const gmail = google.gmail({ version: "v1", auth: oauthClient() });
    const raw = Buffer.from(
      [
        args.to ? `To: ${args.to}` : "",
        `Subject: ${args.subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        args.body,
      ]
        .filter(Boolean)
        .join("\r\n")
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const res = await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { raw } },
    });
    return { simulated: false, id: res.data.id ?? undefined };
  } catch (e) {
    console.error("[google] gmail draft failed, simulating:", e);
    return { simulated: true };
  }
}

/** Read upcoming busy slots so the planner can schedule around them. */
export async function busySlots(hoursAhead = 48): Promise<{ start: string; end: string }[]> {
  if (!hasGoogle()) return [];
  try {
    const calendar = google.calendar({ version: "v3", auth: oauthClient() });
    const now = new Date();
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: new Date(now.getTime() + hoursAhead * 3600 * 1000).toISOString(),
        items: [{ id: "primary" }],
      },
    });
    const busy = res.data.calendars?.primary?.busy ?? [];
    return busy.map((b) => ({ start: b.start!, end: b.end! }));
  } catch (e) {
    console.error("[google] freebusy failed:", e);
    return [];
  }
}
