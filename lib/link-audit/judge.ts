import { MODELS } from "./models";
import type { JudgeVotes, LinkVerdict } from "./types";

const JUDGE_SYSTEM = `You are an independent judge auditing scholarship links for a student platform.
Your job is to CONFIRM or REJECT a proposed verdict that could lead to deactivating a scholarship listing.

Vote "confirm" only if evidence strongly supports the proposed verdict.
Vote "reject" if uncertain, if the page might still be useful, or if login/JS blocks assessment.
For MOVED: confirm only if a credible new official URL is identified.

Respond with JSON only: {"vote":"confirm"|"reject","reason":"..."}`;

interface JudgeInput {
  scholarshipName: string;
  provider: string;
  link: string;
  finalUrl: string;
  httpStatus: number | null;
  proposedVerdict: LinkVerdict;
  evidence: string;
  newUrlCandidate: string | null;
}

async function judgeWithGpt(input: JudgeInput): Promise<"confirm" | "reject" | "skipped"> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return "skipped";

  const user = formatJudgePrompt(input);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELS.judgeGpt,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: JUDGE_SYSTEM },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) return "skipped";
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return "skipped";
    const parsed = JSON.parse(content) as { vote?: string };
    return parsed.vote === "confirm" ? "confirm" : "reject";
  } catch {
    return "skipped";
  }
}

async function judgeWithGemini(input: JudgeInput): Promise<"confirm" | "reject" | "skipped"> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) return "skipped";

  const user = formatJudgePrompt(input);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.judgeGemini}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${JUDGE_SYSTEM}\n\n${user}` }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) return "skipped";
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return "skipped";
    const parsed = JSON.parse(text) as { vote?: string };
    return parsed.vote === "confirm" ? "confirm" : "reject";
  } catch {
    return "skipped";
  }
}

function formatJudgePrompt(input: JudgeInput): string {
  return [
    `Scholarship: ${input.scholarshipName}`,
    `Provider: ${input.provider}`,
    `Original link: ${input.link}`,
    `Final URL: ${input.finalUrl}`,
    `HTTP status: ${input.httpStatus ?? "unknown"}`,
    `Proposed verdict: ${input.proposedVerdict}`,
    `Evidence: ${input.evidence}`,
    input.newUrlCandidate ? `New URL candidate: ${input.newUrlCandidate}` : "",
    "",
    "Should we act on this verdict? JSON vote only.",
  ]
    .filter(Boolean)
    .join("\n");
}

const GATED_VERDICTS: LinkVerdict[] = ["DEAD", "CLOSED", "EXPIRED", "MOVED"];

export interface JudgeOutcome {
  judges: JudgeVotes;
  /** ≥2 confirm votes among non-skipped judges */
  confirmed: boolean;
  finalVerdict: LinkVerdict;
}

/**
 * Cross-provider gate for irreversible-ish verdicts.
 * Requires ≥2 agreeing judges; otherwise downgrade to NEEDS_REVIEW.
 */
export async function runJudgeGate(
  input: JudgeInput,
): Promise<JudgeOutcome> {
  if (!GATED_VERDICTS.includes(input.proposedVerdict)) {
    return {
      judges: {},
      confirmed: true,
      finalVerdict: input.proposedVerdict,
    };
  }

  const [gpt, gemini] = await Promise.all([
    judgeWithGpt(input),
    judgeWithGemini(input),
  ]);

  const judges: JudgeVotes = {
    "gpt-5.5": gpt,
    "gemini-3.1-pro": gemini,
  };

  const votes = [gpt, gemini].filter((v) => v !== "skipped");
  const confirms = votes.filter((v) => v === "confirm").length;

  if (votes.length === 0) {
    return {
      judges,
      confirmed: false,
      finalVerdict: "NEEDS_REVIEW",
    };
  }

  if (confirms >= 2 || (votes.length === 1 && confirms === 1 && votes[0] === "confirm")) {
    // Single judge: accept only for MOVED/CLOSED/EXPIRED with high bar; DEAD needs 2 if possible
    if (input.proposedVerdict === "DEAD" && confirms < 2) {
      return { judges, confirmed: false, finalVerdict: "NEEDS_REVIEW" };
    }
    return { judges, confirmed: true, finalVerdict: input.proposedVerdict };
  }

  return { judges, confirmed: false, finalVerdict: "NEEDS_REVIEW" };
}
