import type { LinkAuditItem, LinkAuditReport, LinkVerdict, SuggestedAction } from "./types";

export function buildSummary(items: LinkAuditItem[]): LinkAuditReport["summary"] {
  const byVerdict = emptyVerdictCounts();
  const byAction = emptyActionCounts();

  let judgeConfirmedDead = 0;
  let httpOnlyAlive = 0;
  let llmEscalated = 0;

  for (const item of items) {
    byVerdict[item.verdict]++;
    byAction[item.suggestedAction]++;

    if (
      item.verdict === "DEAD" &&
      item.judges["gpt-5.5"] === "confirm" &&
      item.judges["gemini-3.1-pro"] === "confirm"
    ) {
      judgeConfirmedDead++;
    }

    if (
      item.verdict === "ALIVE" &&
      item.stagesUsed.length === 1 &&
      item.stagesUsed[0] === "http_probe"
    ) {
      httpOnlyAlive++;
    }

    if (item.stagesUsed.some((s) => s !== "http_probe")) {
      llmEscalated++;
    }
  }

  return {
    total: items.length,
    byVerdict,
    byAction,
    judgeConfirmedDead,
    httpOnlyAlive,
    llmEscalated,
  };
}

function emptyVerdictCounts(): Record<LinkVerdict, number> {
  return {
    ALIVE: 0,
    DEAD: 0,
    CLOSED: 0,
    EXPIRED: 0,
    MOVED: 0,
    NEEDS_REVIEW: 0,
  };
}

function emptyActionCounts(): Record<SuggestedAction, number> {
  return {
    keep: 0,
    flag_needs_review: 0,
    propose_deactivate: 0,
    update_link: 0,
  };
}

export function renderMarkdownSummary(report: LinkAuditReport): string {
  const { summary, items } = report;
  const lines: string[] = [
    "# Scholarship link audit summary",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Counts by verdict",
    "",
    "| Verdict | Count |",
    "|---------|------:|",
  ];

  for (const [v, c] of Object.entries(summary.byVerdict)) {
    lines.push(`| ${v} | ${c} |`);
  }

  lines.push("", "## Counts by suggested action", "", "| Action | Count |", "|--------|------:|");
  for (const [a, c] of Object.entries(summary.byAction)) {
    lines.push(`| ${a} | ${c} |`);
  }

  lines.push(
    "",
    `HTTP-only ALIVE: ${summary.httpOnlyAlive}`,
    `LLM escalated: ${summary.llmEscalated}`,
    `Judge-confirmed DEAD (both judges): ${summary.judgeConfirmedDead}`,
    "",
  );

  const sections: { title: string; filter: (i: LinkAuditItem) => boolean }[] = [
    {
      title: "DEAD (judge-confirmed or high confidence)",
      filter: (i) =>
        i.verdict === "DEAD" &&
        (i.judges["gpt-5.5"] === "confirm" || i.judges["gemini-3.1-pro"] === "confirm"),
    },
    {
      title: "MOVED (new URL candidates)",
      filter: (i) => i.verdict === "MOVED" && i.newUrlCandidate != null,
    },
    {
      title: "NEEDS_REVIEW",
      filter: (i) => i.verdict === "NEEDS_REVIEW",
    },
    {
      title: "Propose deactivate",
      filter: (i) => i.suggestedAction === "propose_deactivate",
    },
  ];

  for (const { title, filter } of sections) {
    const rows = items.filter(filter);
    if (rows.length === 0) continue;
    lines.push(`## ${title}`, "");
    for (const r of rows) {
      lines.push(`- **${r.name}** (\`${r.id}\`)`);
      lines.push(`  - Link: ${r.link}`);
      if (r.finalUrl !== r.link) lines.push(`  - Final: ${r.finalUrl}`);
      lines.push(`  - Verdict: ${r.verdict} (confidence ${r.confidence.toFixed(2)})`);
      if (r.newUrlCandidate) lines.push(`  - New URL: ${r.newUrlCandidate}`);
      lines.push(`  - Evidence: ${r.evidence.slice(0, 120)}…`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
