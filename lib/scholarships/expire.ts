import { prisma } from "@/lib/prisma";

export const PURGE_GRACE_DAYS = 90;

export type ExpireScholarshipsResult = {
  deactivated: number;
};

export type PurgeScholarshipsResult = {
  purged: number;
  skipped: number;
};

export type ScholarshipMaintenanceResult = ExpireScholarshipsResult &
  PurgeScholarshipsResult;

export async function expirePassedScholarships(
  now = new Date()
): Promise<ExpireScholarshipsResult> {
  const result = await prisma.scholarship.updateMany({
    where: {
      isActive: true,
      deadline: { lt: now, not: null },
    },
    data: { isActive: false },
  });

  return { deactivated: result.count };
}

export async function purgeStaleScholarships(
  now = new Date(),
  graceDays = PURGE_GRACE_DAYS
): Promise<PurgeScholarshipsResult> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - graceDays);

  const candidates = await prisma.scholarship.findMany({
    where: {
      isActive: false,
      deadline: { lt: cutoff, not: null },
    },
    select: { id: true },
    take: 500,
  });

  let purged = 0;
  let skipped = 0;

  for (const { id } of candidates) {
    const [applications, saved, bookmarks] = await Promise.all([
      prisma.application.count({ where: { scholarshipId: id } }),
      prisma.savedScholarship.count({ where: { scholarshipId: id } }),
      prisma.bookmark.count({ where: { scholarshipId: id } }),
    ]);

    if (applications + saved + bookmarks > 0) {
      skipped += 1;
      continue;
    }

    await prisma.scholarship.delete({ where: { id } });
    purged += 1;
  }

  return { purged, skipped };
}

export async function runScholarshipMaintenance(
  now = new Date()
): Promise<ScholarshipMaintenanceResult> {
  const expired = await expirePassedScholarships(now);
  const purged = await purgeStaleScholarships(now);
  return { ...expired, ...purged };
}
