/**
 * U3 — Schema-check researched universities and verify official websites.
 * Reads data/universities-researched.json → data/universities-validated.json
 *
 * Usage:
 *   npx tsx scripts/validate-researched-universities.ts
 *   npx tsx scripts/validate-researched-universities.ts --dry-run
 */
import fs from "node:fs";
import * as dotenv from "dotenv";
import { parseCliArgs, mapPool } from "../lib/universities/cli";
import { PATHS } from "../lib/universities/paths";
import type {
  ResearchedUniversity,
  UniversitiesResearchedFile,
  UniversitiesValidatedFile,
  ValidatedUniversity,
} from "../lib/universities/types";
import { verifyWebsite } from "../lib/universities/verify-website";

dotenv.config();

const REQUIRED = ["name", "country", "city", "website", "description"] as const;
const MIN_FIELDS = 2;
const MIN_DESCRIPTION = 80;

function schemaIssues(u: ResearchedUniversity): string[] {
  const notes: string[] = [];
  for (const key of REQUIRED) {
    const v = u[key];
    if (typeof v !== "string" || !v.trim()) {
      notes.push(`missing_${key}`);
    }
  }
  if (!u.website.startsWith("http")) notes.push("invalid_website_scheme");
  if (!Array.isArray(u.fields) || u.fields.length < MIN_FIELDS) {
    notes.push(`fields_lt_${MIN_FIELDS}`);
  }
  if (!u.description || u.description.length < MIN_DESCRIPTION) {
    notes.push("description_too_short");
  }
  if (!Array.isArray(u.sources) || u.sources.length === 0) {
    notes.push("no_sources");
  }
  return notes;
}

async function main() {
  const { dryRun, input, output } = parseCliArgs(process.argv);
  const inputPath = input ?? PATHS.researched;
  const outputPath = output ?? PATHS.validated;

  if (!fs.existsSync(inputPath)) {
    console.error(`Missing input: ${inputPath}\nRun U2 first.`);
    process.exit(1);
  }

  const data = JSON.parse(
    fs.readFileSync(inputPath, "utf8"),
  ) as UniversitiesResearchedFile;
  const universities = data.universities ?? [];

  console.log("=== U3: Validate researched universities ===\n");
  console.log(`Input: ${universities.length} record(s)`);
  if (dryRun) console.log("DRY RUN — no file written.\n");

  const dropped: { name: string; reasons: string[] }[] = [];
  const valid: ValidatedUniversity[] = [];

  const checked = await mapPool(universities, 5, async (u) => {
    const schema = schemaIssues(u);
    if (schema.length > 0) {
      dropped.push({ name: u.name, reasons: schema });
      console.log(`  ✗ ${u.name} — ${schema.join(", ")}`);
      return null;
    }

    const websiteOk = await verifyWebsite(u.website);
    if (!websiteOk) {
      dropped.push({ name: u.name, reasons: ["website_unreachable"] });
      console.log(`  ✗ ${u.name} — website unreachable`);
      return null;
    }

    console.log(`  ✓ ${u.name}`);
    return { ...u, websiteOk: true, validationNotes: [] } satisfies ValidatedUniversity;
  });

  for (const v of checked) {
    if (v) valid.push(v);
  }

  const payload: UniversitiesValidatedFile = {
    generatedAt: new Date().toISOString(),
    stats: {
      input: universities.length,
      valid: valid.length,
      dropped: dropped.length,
    },
    universities: valid,
  };

  console.log("\n" + "─".repeat(40));
  console.log(`  Input:   ${payload.stats.input}`);
  console.log(`  Valid:   ${payload.stats.valid}`);
  console.log(`  Dropped: ${payload.stats.dropped}`);

  if (!dryRun) {
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`\nWrote ${outputPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
