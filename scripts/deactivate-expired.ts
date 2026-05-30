/**
 * U0 — Deactivate scholarships whose deadline has passed.
 * Null deadlines are left unchanged.
 *
 * Usage:
 *   npx tsx scripts/deactivate-expired.ts
 *   npx tsx scripts/deactivate-expired.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  const now = new Date();

  const where = {
    isActive: true,
    deadline: { lt: now, not: null },
  };

  const count = await prisma.scholarship.count({ where });

  console.log("=== Expire passed scholarships ===");
  console.log(`Cutoff: ${now.toISOString()}`);
  if (DRY_RUN) {
    console.log(`DRY RUN — would deactivate ${count} scholarship(s).`);
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.scholarship.updateMany({
    where,
    data: { isActive: false },
  });

  console.log(`Deactivated ${result.count} scholarship(s).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
