/**
 * Model IDs — swap when providers release new versions.
 * See scripts/LINK_AUDIT.md for role mapping.
 */
export const MODELS = {
  /** Stage 1 — bulk classify */
  classify: process.env.LINK_AUDIT_CLASSIFY_MODEL ?? "claude-haiku-4-5-20251001",
  /** Stage 2 — render / redirect hunt */
  render: process.env.LINK_AUDIT_RENDER_MODEL ?? "claude-sonnet-4-20250514",
  /** Stage 2b — hardest leaf */
  hardLeaf: process.env.LINK_AUDIT_HARD_MODEL ?? "claude-sonnet-4-20250514",
  /** Judge — cross-provider (override via env) */
  judgeGpt: process.env.LINK_AUDIT_JUDGE_GPT_MODEL ?? "gpt-4.1",
  judgeGemini: process.env.LINK_AUDIT_JUDGE_GEMINI_MODEL ?? "gemini-2.5-pro",
} as const;
