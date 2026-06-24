import Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "./models";
import type { ClassifyResult, PageClass, ScholarshipRow } from "./types";
import type { HttpProbeResult } from "./types";

const CLASSIFY_INSTRUCTIONS = `Tu audites des liens de bourses pour Mibegnon (plateforme ivoirienne).
Classifie la page atteinte par le lien officiel d'une bourse.

Verdicts:
- OPEN: page valide, programme/bourse accessible ou informations claires encore utiles
- CLOSED: candidatures fermées, programme clôturé (page existe)
- EXPIRED: date limite dépassée mentionnée explicitement
- MOVED: page redirigée ou contenu déplacé — fournis newUrlCandidate si trouvé
- DEAD: 404, domaine mort, page supprimée, parking, erreur fatale
- UNSURE: ambigu (login requis, JS vide, contenu insuffisant)

Règles:
- Ne déclare DEAD que si la preuve est forte (404, "not found", domaine expiré).
- Login portal sans info publique → UNSURE, pas DEAD.
- Cite un extrait court comme evidence (≤200 caractères).
- confidence entre 0 et 1.`;

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: "classify_link_page",
  description: "Classify scholarship application page status.",
  input_schema: {
    type: "object" as const,
    required: ["pageClass", "confidence", "evidence"],
    properties: {
      pageClass: {
        type: "string",
        enum: ["OPEN", "CLOSED", "EXPIRED", "MOVED", "DEAD", "UNSURE"],
      },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      evidence: { type: "string" },
      newUrlCandidate: { type: ["string", "null"] },
    },
  },
};

export async function classifyPage(
  scholarship: ScholarshipRow,
  probe: HttpProbeResult,
  model = MODELS.classify,
): Promise<ClassifyResult> {
  const client = new Anthropic();

  const context = [
    `SCHOLARSHIP: ${scholarship.name}`,
    `PROVIDER: ${scholarship.provider}`,
    `ORIGINAL LINK: ${scholarship.link}`,
    `FINAL URL: ${probe.finalUrl}`,
    `HTTP STATUS: ${probe.httpStatus ?? "unknown"}`,
    `REDIRECTS: ${probe.redirectChain.join(" → ")}`,
    probe.title ? `TITLE: ${probe.title}` : "",
    probe.bodyText ? `BODY:\n${probe.bodyText.slice(0, 6000)}` : "(no body fetched)",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "classify_link_page" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: CLASSIFY_INSTRUCTIONS,
            cache_control: { type: "ephemeral" },
          },
          { type: "text", text: context },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b) => b.type === "tool_use" && b.name === "classify_link_page",
  );
  if (!toolUse || toolUse.type !== "tool_use") {
    return {
      pageClass: "UNSURE",
      confidence: 0.3,
      evidence: "classify_no_output",
      newUrlCandidate: null,
      model,
      stage: "bulk_classify",
    };
  }

  const raw = toolUse.input as {
    pageClass: PageClass;
    confidence: number;
    evidence: string;
    newUrlCandidate?: string | null;
  };

  return {
    pageClass: raw.pageClass ?? "UNSURE",
    confidence: raw.confidence ?? 0.5,
    evidence: raw.evidence ?? "",
    newUrlCandidate: raw.newUrlCandidate ?? null,
    model,
    stage: "bulk_classify",
  };
}

export async function renderHuntPage(
  scholarship: ScholarshipRow,
  probe: HttpProbeResult,
  prior: ClassifyResult | null,
  model = MODELS.render,
): Promise<ClassifyResult> {
  const client = new Anthropic();

  const RENDER_INSTRUCTIONS = `Tu es un agent de recherche de liens pour Mibegnon.
Analyse redirect chains, pages de login, parking, et cherche une URL officielle mise à jour si MOVED.
Même schéma de classification que l'étape bulk. Sois conservateur: UNSURE si doute.
Si tu trouves une nouvelle URL officielle de candidature, mets-la dans newUrlCandidate.`;

  const context = [
    `SCHOLARSHIP: ${scholarship.name}`,
    `PROVIDER: ${scholarship.provider}`,
    `LINK: ${scholarship.link}`,
    `FINAL URL: ${probe.finalUrl}`,
    `HTTP: ${probe.httpStatus}`,
    `REDIRECTS: ${probe.redirectChain.join(" → ")}`,
    prior ? `PRIOR CLASSIFY: ${prior.pageClass} (${prior.confidence}) — ${prior.evidence}` : "",
    probe.title ? `TITLE: ${probe.title}` : "",
    probe.bodyText ? `BODY:\n${probe.bodyText.slice(0, 10000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model,
    max_tokens: 768,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "classify_link_page" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: RENDER_INSTRUCTIONS,
            cache_control: { type: "ephemeral" },
          },
          { type: "text", text: context },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b) => b.type === "tool_use" && b.name === "classify_link_page",
  );
  if (!toolUse || toolUse.type !== "tool_use") {
    return {
      pageClass: "UNSURE",
      confidence: 0.3,
      evidence: "render_no_output",
      newUrlCandidate: null,
      model,
      stage: "render_hunt",
    };
  }

  const raw = toolUse.input as {
    pageClass: PageClass;
    confidence: number;
    evidence: string;
    newUrlCandidate?: string | null;
  };

  return {
    pageClass: raw.pageClass ?? "UNSURE",
    confidence: raw.confidence ?? 0.5,
    evidence: raw.evidence ?? "",
    newUrlCandidate: raw.newUrlCandidate ?? null,
    model,
    stage: "render_hunt",
  };
}

export async function hardLeafClassify(
  scholarship: ScholarshipRow,
  probe: HttpProbeResult,
  prior: ClassifyResult,
  model = MODELS.hardLeaf,
): Promise<ClassifyResult> {
  const client = new Anthropic();

  const HARD_INSTRUCTIONS = `Cas ambigu: détermine si la bourse "${scholarship.name}" accepte encore des candidatures via ce lien.
Réponds avec le même outil classify_link_page. Ne dis DEAD/CLOSED que si preuve explicite.`;

  const response = await client.messages.create({
    model,
    max_tokens: 768,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "classify_link_page" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: HARD_INSTRUCTIONS, cache_control: { type: "ephemeral" } },
          {
            type: "text",
            text: [
              `Provider: ${scholarship.provider}`,
              `Deadline (DB): ${scholarship.deadline?.toISOString() ?? "null"}`,
              `URL: ${probe.finalUrl}`,
              `Prior: ${prior.pageClass} — ${prior.evidence}`,
              probe.bodyText?.slice(0, 8000) ?? "",
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b) => b.type === "tool_use" && b.name === "classify_link_page",
  );
  if (!toolUse || toolUse.type !== "tool_use") {
    return { ...prior, stage: "hard_leaf" };
  }

  const raw = toolUse.input as {
    pageClass: PageClass;
    confidence: number;
    evidence: string;
    newUrlCandidate?: string | null;
  };

  return {
    pageClass: raw.pageClass ?? "UNSURE",
    confidence: raw.confidence ?? prior.confidence,
    evidence: raw.evidence ?? prior.evidence,
    newUrlCandidate: raw.newUrlCandidate ?? prior.newUrlCandidate,
    model,
    stage: "hard_leaf",
  };
}
