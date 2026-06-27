// Lightweight natural-language parsing for the no-LLM fallback path.
// Understands English + Hinglish dates/times and pulls a clean task title.

export interface When {
  iso?: string;
  label?: string;
}

const TYPE_WORDS = ["exam", "test", "quiz", "paper", "assignment", "viva", "project", "submission", "lab", "report", "presentation", "homework", "interview", "meeting"];

const ACRONYMS = new Set(["dbms", "os", "dsa", "oop", "oops", "coa", "cn", "ml", "ai", "se", "toc", "daa", "dccn", "ds", "html", "css", "api", "ppt", "hr", "gst", "emi", "ielts", "gre", "cat"]);

const FILLER = new Set([
  "meri", "mera", "mere", "meraa", "hai", "hain", "ki", "ka", "ke", "ko", "kal", "aaj", "parso", "abhi", "tak", "yaar",
  "bhai", "please", "plz", "remind", "me", "to", "add", "a", "an", "the", "there", "is", "its", "it's", "at", "on", "by",
  "i", "have", "has", "need", "needto", "gotta", "got", "tomorrow", "tomo", "tommo", "tmrw", "tmr", "today", "tonight",
  "pm", "am", "baje", "bje", "in", "hours", "hour", "hrs", "hr", "min", "mins", "minute", "minutes", "raat", "subah",
  "shaam", "dopahar", "morning", "evening", "night", "noon", "afternoon", "due", "deadline", "and", "for", "of", "my",
  "this", "next", "that", "about", "around", "before", "submit", "karna", "krna", "hoga", "wala", "wali",
]);

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function friendly(d: Date, now = new Date()): string {
  const sameDay = d.toDateString() === now.toDateString();
  const tmrw = new Date(now);
  tmrw.setDate(now.getDate() + 1);
  const isTmrw = d.toDateString() === tmrw.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `today, ${time}`;
  if (isTmrw) return `tomorrow, ${time}`;
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
}

/** Parse a date/time expression (English or Hinglish) into an ISO timestamp. */
export function parseWhen(text: string, nowMs = Date.now()): When {
  const t = " " + text.toLowerCase() + " ";

  // Relative: "in 2 hours" / "in 30 min"
  let m = t.match(/\bin\s+(\d+)\s*(h|hr|hrs|hour|hours)\b/);
  if (m) {
    const d = new Date(nowMs + Number(m[1]) * 60 * 60000);
    return { iso: d.toISOString(), label: friendly(d) };
  }
  m = t.match(/\bin\s+(\d+)\s*(m|min|mins|minute|minutes)\b/);
  if (m) {
    const d = new Date(nowMs + Number(m[1]) * 60000);
    return { iso: d.toISOString(), label: friendly(d) };
  }

  let dayOffset: number | null = null;
  if (/\bparso\b|day after tomorrow/.test(t)) dayOffset = 2;
  else if (/\bkal\b|\btomorrow\b|\btomo\b|\btommo\b|\btmrw\b|\btmr\b/.test(t)) dayOffset = 1;
  else if (/\baaj\b|\btoday\b|\btonight\b/.test(t)) dayOffset = 0;

  let hour: number | null = null;
  let min = 0;
  if ((m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/))) {
    hour = Number(m[1]) % 12;
    if (m[3] === "pm") hour += 12;
    min = m[2] ? Number(m[2]) : 0;
  } else if ((m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*b(?:a)?je\b/))) {
    hour = Number(m[1]);
    min = m[2] ? Number(m[2]) : 0;
    if (hour < 12 && /\braat\b|\bshaam\b|\bevening\b|\bnight\b|\bpm\b/.test(t)) hour += 12;
  } else if ((m = t.match(/\b(\d{1,2}):(\d{2})\b/))) {
    hour = Number(m[1]);
    min = Number(m[2]);
  } else if (/\btonight\b|\braat\b/.test(t)) hour = 21;
  else if (/\bsubah\b|\bmorning\b/.test(t)) hour = 9;
  else if (/\bdopahar\b|\bnoon\b/.test(t)) hour = 12;
  else if (/\bshaam\b|\bevening\b/.test(t)) hour = 18;

  if (dayOffset === null && hour === null) return {};

  const explicitToday = /\baaj\b|\btoday\b|\btonight\b/.test(t);
  const d = new Date(nowMs);
  d.setDate(d.getDate() + (dayOffset ?? 0));
  d.setHours(hour ?? 9, min, 0, 0);
  // Time given without a day, and it already passed today → assume tomorrow.
  if (dayOffset === null && d.getTime() <= nowMs && !explicitToday) d.setDate(d.getDate() + 1);

  return { iso: d.toISOString(), label: friendly(d) };
}

/** Extract a clean task title from a free-text (often Hinglish) sentence. */
export function extractTaskTitle(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[.,!?;:]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    // drop numbers and glued time tokens (10, 10:30, 10pm, 5am, 9baje)
    .filter((w) => !/^\d{1,2}(:\d{2})?(am|pm|baje|bje)?$/.test(w))
    .filter((w) => !FILLER.has(w));

  if (words.length === 0) return "";

  const typeWord = words.find((w) => TYPE_WORDS.includes(w));
  const rest = words.filter((w) => w !== typeWord);

  const cap = (w: string) => (ACRONYMS.has(w) ? w.toUpperCase() : w);

  let titleWords: string[];
  if (typeWord && rest.length > 0) {
    titleWords = [...rest.map(cap), typeWord]; // "DBMS exam"
  } else {
    titleWords = words.map(cap);
  }
  const title = titleWords.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}
