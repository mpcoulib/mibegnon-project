/**
 * Purge manuelle des données d'accompagnement expirées (voir lib/coaching/purge.ts).
 *
 * Usage:
 *   npm run coaching:purge:dry   # compte seulement
 *   npm run coaching:purge       # supprime
 */
import * as dotenv from "dotenv";
import { prisma } from "@/lib/prisma";
import { runCoachingPurge } from "@/lib/coaching/purge";

dotenv.config();
dotenv.config({ path: ".env.local" });

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const result = await runCoachingPurge(new Date(), DRY_RUN);
  console.log(DRY_RUN ? "[dry-run] Ce qui serait purgé :" : "Purge effectuée :");
  console.table(result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
