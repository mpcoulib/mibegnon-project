/**
 * Read-only scholarship external-link audit.
 *
 * Pipeline: HTTP probe → Haiku classify → Sonnet render/hunt → cross-provider judge.
 * No DB writes — outputs data/link_audit_report.json + link_audit_summary.md
 *
 * Usage:
 *   npx tsx scripts/audit-scholarship-links.ts
 *   npx tsx scripts/audit-scholarship-links.ts --limit 20 --concurrency 5
 *   npx tsx scripts/audit-scholarship-links.ts --http-only
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { mapPool } from "../lib/universities/cli";
import { MODELS } from "../lib/link-audit/models";
import { auditOneLink } from "../lib/link-audit/pipeline";
import { buildSummary, renderMarkdownSummary } from "../lib/link-audit/report";
import { DomainRateLimiter, groupByDomain } from "../lib/link-audit/rate-limit";
import type { LinkAuditReport } from "../lib/link-audit/types";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const REPORT_JSON = path.join(DATA_DIR, "link_audit_report.json");
const REPORT_MD = path.join(DATA_DIR, "link_audit_summary.md");

function parseArgs() {
  const args = process.argv.slice(2);
  const has = (f: string) => args.includes(f);
  const val = (f: string) => {
    const i = args.indexOf(f);
    return i !== -1 && args[i + 1] ? args[i + 1] : null;
  };
  const num = (f: string, d: number) => {
    const v = val(f);
    return v ? Number(v) : d;
  };
  return {
    limit: val("--limit") ? num("--limit", 0) : null,
    offset: num("--offset", 0),
    concurrency: num("--concurrency", 10),
    httpOnly: has("--http-only"),
    activeOnly: has("--active-only"),
    outputJson: val("--output") ?? REPORT_JSON,
    outputMd: val("--summary") ?? REPORT_MD,
  };
}

async function main() {
  const opts = parseArgs();

  console.log("=== Scholarship link audit (read-only) ===\n");
  console.log(`Concurrency: ${opts.concurrency}`);
  console.log(`HTTP only:   ${opts.httpOnly}`);
  if (opts.httpOnly) console.log("  (LLM stages + judge skipped)\n");
  else {
    console.log(`Classify:    ${MODELS.classify}`);
    console.log(`Render:      ${MODELS.render}`);
    console.log(`Judge GPT:   ${MODELS.judgeGpt} (${process.env.OPENAI_API_KEY ? "key set" : "no key"})`);
    console.log(
      `Judge Gemini:${MODELS.judgeGemini} (${process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? "key set" : "no key"})`,
    );
    console.log("");
  }

  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

  try {
    let rows = await prisma.scholarship.findMany({
      where: opts.activeOnly ? { isActive: true } : undefined,
      select: {
        id: true,
        name: true,
        provider: true,
        link: true,
        deadline: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    if (opts.offset > 0) rows = rows.slice(opts.offset);
    if (opts.limit != null) rows = rows.slice(0, opts.limit);

    const domains = groupByDomain(rows);
    console.log(`Loaded ${rows.length} scholarship(s) across ${domains.size} domain(s).\n`);

    const limiter = new DomainRateLimiter(350);
    let done = 0;

    const items = await mapPool(rows, opts.concurrency, async (row) => {
      await limiter.waitFor(row.link || "http://invalid");
      const item = await auditOneLink(row, { skipLlm: opts.httpOnly });
      done++;
      const icon =
        item.verdict === "ALIVE"
          ? "✓"
          : item.verdict === "NEEDS_REVIEW"
            ? "?"
            : "✗";
      process.stdout.write(
        `  ${icon} [${done}/${rows.length}] ${item.verdict.padEnd(12)} ${row.name.slice(0, 50)}\n`,
      );
      return item;
    });

    const report: LinkAuditReport = {
      generatedAt: new Date().toISOString(),
      config: {
        limit: opts.limit,
        offset: opts.offset,
        concurrency: opts.concurrency,
        skipLlm: opts.httpOnly,
        models: { ...MODELS },
      },
      summary: buildSummary(items),
      items,
    };

    fs.mkdirSync(path.dirname(opts.outputJson), { recursive: true });
    fs.writeFileSync(opts.outputJson, JSON.stringify(report, null, 2));
    fs.writeFileSync(opts.outputMd, renderMarkdownSummary(report));

    console.log("\n" + "─".repeat(45));
    console.log("Summary:");
    for (const [v, c] of Object.entries(report.summary.byVerdict)) {
      if (c > 0) console.log(`  ${v.padEnd(14)} ${c}`);
    }
    console.log(`\nWrote ${opts.outputJson}`);
    console.log(`Wrote ${opts.outputMd}`);
    console.log("\nNo DB changes — review report before any deactivation.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
