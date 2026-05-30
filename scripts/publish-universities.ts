/**
 * U5 helper — Publish staged universities (isActive=true) after human review.
 *
 * Usage:
 *   npx tsx scripts/publish-universities.ts --ids clxyz,clabc
 *   npx tsx scripts/publish-universities.ts --all-staged
 *   npx tsx scripts/publish-universities.ts --all-staged --dry-run
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ALL_STAGED = args.includes("--all-staged");
const idsArg = args.indexOf("--ids");
const IDS =
  idsArg !== -1 && args[idsArg + 1]
    ? args[idsArg + 1].split(",").map((s) => s.trim()).filter(Boolean)
    : [];

async function main() {
  if (!ALL_STAGED && IDS.length === 0) {
    console.error("Provide --ids id1,id2 or --all-staged");
    process.exit(1);
  }

  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

  const where = ALL_STAGED
    ? { isActive: false, hasScholarships: true }
    : { id: { in: IDS } };

  const rows = await prisma.university.findMany({
    where,
    select: { id: true, name: true, isActive: true },
  });

  if (rows.length === 0) {
    console.log("No universities matched.");
    await prisma.$disconnect();
    return;
  }

  console.log("=== Publish universities ===\n");
  for (const r of rows) {
    console.log(`  • ${r.name} (${r.id})${r.isActive ? " [already active]" : ""}`);
  }

  if (DRY_RUN) {
    console.log(`\nDRY RUN — would publish ${rows.filter((r) => !r.isActive).length}.`);
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.university.updateMany({
    where: { id: { in: rows.map((r) => r.id) }, isActive: false },
    data: { isActive: true },
  });

  console.log(`\nPublished ${result.count} universit(y/ies).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
