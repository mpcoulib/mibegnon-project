import {
  classifyPage,
  hardLeafClassify,
  renderHuntPage,
} from "./classify";
import {
  httpProbe,
  pageClassToVerdict,
  suggestedActionFor,
} from "./http-probe";
import { runJudgeGate } from "./judge";
import type {
  AuditStage,
  ClassifyResult,
  LinkAuditItem,
  LinkVerdict,
  ScholarshipRow,
} from "./types";

export interface AuditLinkOptions {
  skipLlm: boolean;
}

export async function auditOneLink(
  scholarship: ScholarshipRow,
  options: AuditLinkOptions,
): Promise<LinkAuditItem> {
  const stagesUsed: AuditStage[] = ["http_probe"];
  const link = scholarship.link?.trim() ?? "";

  if (!link) {
    return buildItem(scholarship, {
      finalUrl: "",
      httpStatus: null,
      redirectChain: [],
      verdict: "NEEDS_REVIEW",
      confidence: 0.95,
      evidence: "empty_link",
      judges: {},
      suggestedAction: "flag_needs_review",
      newUrlCandidate: null,
      stagesUsed,
    });
  }

  const probe = await httpProbe(link);

  if (
    !options.skipLlm &&
    probe.earlyVerdict === "ALIVE" &&
    !probe.needsEscalation &&
    probe.earlyConfidence >= 0.85
  ) {
    return buildItem(scholarship, {
      finalUrl: probe.finalUrl,
      httpStatus: probe.httpStatus,
      redirectChain: probe.redirectChain,
      verdict: "ALIVE",
      confidence: probe.earlyConfidence,
      evidence: `HTTP ${probe.httpStatus}, same host, content OK`,
      judges: {},
      suggestedAction: "keep",
      newUrlCandidate: null,
      stagesUsed,
    });
  }

  let classifyResult: ClassifyResult | null = null;
  let verdict: LinkVerdict = probe.earlyVerdict ?? "NEEDS_REVIEW";
  let confidence = probe.earlyConfidence || 0.5;
  let evidence = probe.error ?? probe.escalationReason ?? "http_ambiguous";
  let newUrlCandidate: string | null =
    probe.finalUrl !== link ? probe.finalUrl : null;

  if (!options.skipLlm && process.env.ANTHROPIC_API_KEY) {
    if (probe.needsEscalation) {
      stagesUsed.push("bulk_classify");
      classifyResult = await classifyPage(scholarship, probe);
      const mapped = pageClassToVerdict(classifyResult.pageClass);
      if (mapped !== "UNSURE") {
        verdict = mapped;
        confidence = classifyResult.confidence;
        evidence = classifyResult.evidence;
        newUrlCandidate = classifyResult.newUrlCandidate ?? newUrlCandidate;
      }

      if (
        classifyResult.pageClass === "UNSURE" ||
        probe.escalationReason === "js_render_needed" ||
        probe.escalationReason === "cross_host_redirect"
      ) {
        stagesUsed.push("render_hunt");
        const renderResult = await renderHuntPage(
          scholarship,
          probe,
          classifyResult,
        );
        classifyResult = renderResult;
        const mapped2 = pageClassToVerdict(renderResult.pageClass);
        if (mapped2 !== "UNSURE") {
          verdict = mapped2;
          confidence = renderResult.confidence;
          evidence = renderResult.evidence;
          newUrlCandidate = renderResult.newUrlCandidate ?? newUrlCandidate;
        }

        if (renderResult.pageClass === "UNSURE" && renderResult.confidence < 0.6) {
          stagesUsed.push("hard_leaf");
          const hard = await hardLeafClassify(scholarship, probe, renderResult);
          classifyResult = hard;
          const mapped3 = pageClassToVerdict(hard.pageClass);
          if (mapped3 !== "UNSURE") {
            verdict = mapped3;
            confidence = hard.confidence;
            evidence = hard.evidence;
            newUrlCandidate = hard.newUrlCandidate ?? newUrlCandidate;
          } else {
            verdict = "NEEDS_REVIEW";
          }
        }
      }
    } else if (probe.earlyVerdict && probe.earlyVerdict !== "ALIVE") {
      stagesUsed.push("bulk_classify");
      classifyResult = await classifyPage(scholarship, probe);
      const mapped = pageClassToVerdict(classifyResult.pageClass);
      if (mapped !== "UNSURE") {
        verdict = mapped;
        confidence = classifyResult.confidence;
        evidence = classifyResult.evidence;
        newUrlCandidate = classifyResult.newUrlCandidate ?? newUrlCandidate;
      }
    }
  } else if (probe.earlyVerdict) {
    verdict = probe.earlyVerdict;
  }

  const needsJudge = ["DEAD", "CLOSED", "EXPIRED", "MOVED"].includes(verdict);
  let judges = {};
  let judgeConfirmed = !needsJudge;
  let finalVerdict = verdict;

  if (needsJudge && !options.skipLlm) {
    stagesUsed.push("judge");
    const gate = await runJudgeGate({
      scholarshipName: scholarship.name,
      provider: scholarship.provider,
      link,
      finalUrl: probe.finalUrl,
      httpStatus: probe.httpStatus,
      proposedVerdict: verdict,
      evidence,
      newUrlCandidate,
    });
    judges = gate.judges;
    judgeConfirmed = gate.confirmed;
    finalVerdict = gate.finalVerdict;
  } else if (needsJudge && options.skipLlm) {
    finalVerdict = "NEEDS_REVIEW";
    judgeConfirmed = false;
  }

  return buildItem(scholarship, {
    finalUrl: probe.finalUrl,
    httpStatus: probe.httpStatus,
    redirectChain: probe.redirectChain,
    verdict: finalVerdict,
    confidence,
    evidence,
    judges,
    suggestedAction: suggestedActionFor(finalVerdict, judgeConfirmed),
    newUrlCandidate,
    stagesUsed,
  });
}

function buildItem(
  scholarship: ScholarshipRow,
  fields: Omit<
    LinkAuditItem,
    "id" | "name" | "provider" | "link" | "deadline" | "isActive" | "auditedAt"
  >,
): LinkAuditItem {
  return {
    id: scholarship.id,
    name: scholarship.name,
    provider: scholarship.provider,
    link: scholarship.link,
    deadline: scholarship.deadline?.toISOString() ?? null,
    isActive: scholarship.isActive,
    auditedAt: new Date().toISOString(),
    ...fields,
  };
}
