/** Page-level classification labels (Stages 1–2). */
export type PageClass =
  | "OPEN"
  | "CLOSED"
  | "EXPIRED"
  | "MOVED"
  | "DEAD"
  | "UNSURE";

/** Final audit verdict written to the report. */
export type LinkVerdict =
  | "ALIVE"
  | "DEAD"
  | "CLOSED"
  | "EXPIRED"
  | "MOVED"
  | "NEEDS_REVIEW";

export type SuggestedAction =
  | "keep"
  | "flag_needs_review"
  | "propose_deactivate"
  | "update_link";

export type AuditStage =
  | "http_probe"
  | "bulk_classify"
  | "render_hunt"
  | "hard_leaf"
  | "judge";

export interface ScholarshipRow {
  id: string;
  name: string;
  provider: string;
  link: string;
  deadline: Date | null;
  isActive: boolean;
}

export interface HttpProbeResult {
  originalUrl: string;
  finalUrl: string;
  httpStatus: number | null;
  redirectChain: string[];
  sameHost: boolean;
  bodyText: string | null;
  title: string | null;
  error: string | null;
  /** Resolved at probe time without LLM. */
  earlyVerdict: LinkVerdict | null;
  earlyConfidence: number;
  /** Escalate to LLM stages. */
  needsEscalation: boolean;
  escalationReason: string | null;
}

export interface ClassifyResult {
  pageClass: PageClass;
  confidence: number;
  evidence: string;
  newUrlCandidate: string | null;
  model: string;
  stage: AuditStage;
}

export interface JudgeVotes {
  "gpt-5.5"?: "confirm" | "reject" | "skipped";
  "gemini-3.1-pro"?: "confirm" | "reject" | "skipped";
}

export interface LinkAuditItem {
  id: string;
  name: string;
  provider: string;
  link: string;
  deadline: string | null;
  isActive: boolean;
  finalUrl: string;
  httpStatus: number | null;
  redirectChain: string[];
  verdict: LinkVerdict;
  confidence: number;
  evidence: string;
  judges: JudgeVotes;
  suggestedAction: SuggestedAction;
  newUrlCandidate: string | null;
  stagesUsed: AuditStage[];
  auditedAt: string;
}

export interface LinkAuditReport {
  generatedAt: string;
  config: {
    limit: number | null;
    offset: number;
    concurrency: number;
    skipLlm: boolean;
    models: Record<string, string>;
  };
  summary: {
    total: number;
    byVerdict: Record<LinkVerdict, number>;
    byAction: Record<SuggestedAction, number>;
    judgeConfirmedDead: number;
    httpOnlyAlive: number;
    llmEscalated: number;
  };
  items: LinkAuditItem[];
}
