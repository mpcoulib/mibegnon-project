import { MAX_MESSAGE_LENGTH, MAX_MESSAGES } from "@/lib/chao/constants";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /you\s+are\s+now/i,
  /jailbreak/i,
  /<\s*script/i,
];

export function sanitizeContent(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let text = raw
    .replace(/\0/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  if (!text) return null;
  if (text.length > MAX_MESSAGE_LENGTH) {
    text = text.slice(0, MAX_MESSAGE_LENGTH);
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, "[filtré]");
    }
  }
  return text;
}

export function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object") return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return null;

  const parsed: ChatMessage[] = [];
  for (const item of messages.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = sanitizeContent((item as { content?: unknown }).content);
    if ((role !== "user" && role !== "assistant") || !content) continue;
    parsed.push({ role, content });
  }

  if (parsed.length === 0) return null;
  const last = parsed[parsed.length - 1];
  if (last.role !== "user") return null;

  return parsed;
}
