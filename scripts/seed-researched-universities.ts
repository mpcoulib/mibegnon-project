/**
 * U4 — Upsert validated universities (isActive=false, hasScholarships=true).
 * Idempotent by normalized name match.
 *
 * Usage:
 *   npx tsx scripts/seed-researched-universities.ts
 *   npx tsx scripts/seed-researched-universities.ts --dry-run
 */
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { parseCliArgs } from "../lib/universities/cli";
import { namesMatch } from "../lib/universities/normalize";
import { PATHS } from "../lib/universities/paths";
import type { UniversitiesValidatedFile } from "../lib/universities/types";

dotenv.config();

async function main() {
  const { dryRun, input } = parseCliArgs(process.argv);
  const inputPath = input ?? PATHS.validated;

  if (!fs.existsSync(inputPath)) {
    console.error(`Missing input: ${inputPath}\nRun U3 first.`);
    process.exit(1);
  }

  const data = JSON.parse(
    fs.readFileSync(inputPath, "utf8"),
  ) as UniversitiesValidatedFile;
  const universities = data.universities ?? [];

  console.log("=== U4: Seed researched universities ===\n");
  console.log(`Input: ${universities.length} validated record(s)`);
  if (dryRun) console.log("DRY RUN — no DB writes.\n");

  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

  let inserted = 0;
  let updated = 0;

  try {
    const existing = await prisma.university.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    for (const u of universities) {
      const match = existing.find((e) => namesMatch(e.name, u.name));

      // Content fields, shared by insert + update.
      const content = {
        name: u.name,
        country: u.country,
        city: u.city,
        website: u.website,
        ranking: u.ranking,
        fields: u.fields,
        description: u.description,
        logoUrl: u.logoUrl,
        hasScholarships: true,
      };

      if (!match) {
        if (dryRun) {
          inserted++;
          console.log(`  [dry] INSERT ${u.name} (staged, isActive=false)`);
        } else {
          // New rows are staged for review; published only via U5.
          const created = await prisma.university.create({
            data: { ...content, isActive: false },
          });
          existing.push({ id: created.id, name: created.name, isActive: created.isActive });
          inserted++;
          console.log(`  + INSERT ${u.name}`);
        }
        continue;
      }

      // UPDATE: refresh content but NEVER touch isActive — re-running must not
      // un-publish a university that is already live.
      if (dryRun) {
        updated++;
        console.log(
          `  [dry] UPDATE ${match.name} → content only (isActive=${match.isActive} preserved)`,
        );
      } else {
        await prisma.university.update({
          where: { id: match.id },
          data: content,
        });
        updated++;
        console.log(`  ~ UPDATE ${match.name} (isActive preserved)`);
      }
    }

    console.log("\n" + "─".repeat(40));
    console.log(`  Inserted: ${inserted}`);
    console.log(`  Updated:  ${updated}`);
    if (!dryRun) {
      console.log("\nReview queue: isActive=false. Publish with:");
      console.log("  npx tsx scripts/publish-universities.ts --ids <id1,id2>");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
