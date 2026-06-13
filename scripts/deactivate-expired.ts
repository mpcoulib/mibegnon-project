/**
 * U0 — Deactivate scholarships whose deadline has passed.
 * Null deadlines are left unchanged.
 *
 * Usage:
 *   npm run scholarships:expire
 *   npm run scholarships:expire:dry
 */
import * as dotenv from "dotenv";
import { prisma } from "@/lib/prisma";
import { expirePassedScholarships } from "@/lib/scholarships/expire";

dotenv.config();

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const now = new Date();

  const count = await prisma.scholarship.count({
    where: {
      isActive: true,
      deadline: { lt: now, not: null },
    },
  });

  console.log("=== Expire passed scholarships ===");
  console.log(`Cutoff: ${now.toISOString()}`);
  if (DRY_RUN) {
    console.log(`DRY RUN — would deactivate ${count} scholarship(s).`);
    return;
  }

  const { deactivated } = await expirePassedScholarships(now);
  console.log(`Deactivated ${deactivated} scholarship(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
