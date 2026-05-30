import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const REVALIDATE_SECONDS = 3600;

function listCacheKey(where: Prisma.ScholarshipWhereInput): string {
  return JSON.stringify(where);
}

export function getScholarshipsForList(where: Prisma.ScholarshipWhereInput) {
  const key = listCacheKey(where);
  return unstable_cache(
    async () => prisma.scholarship.findMany({ where }),
    ["scholarships-list", key],
    { revalidate: REVALIDATE_SECONDS, tags: ["scholarships"] }
  )();
}

export function getScholarshipById(id: string) {
  return unstable_cache(
    async () => prisma.scholarship.findUnique({ where: { id } }),
    ["scholarship", id],
    { revalidate: REVALIDATE_SECONDS, tags: ["scholarships", `scholarship:${id}`] }
  )();
}

export function getFeaturedScholarships() {
  return unstable_cache(
    async () =>
      prisma.scholarship.findMany({
        where: { isActive: true, isTranslated: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ["scholarships-featured"],
    { revalidate: REVALIDATE_SECONDS, tags: ["scholarships"] }
  )();
}

export function getScholarshipsForChaoContext() {
  return unstable_cache(
    async () =>
      prisma.scholarship.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: [{ isFullFunding: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          name: true,
          country: true,
          provider: true,
          deadline: true,
          isFullFunding: true,
          academicLevels: true,
        },
      }),
    ["scholarships-chao-context"],
    { revalidate: REVALIDATE_SECONDS, tags: ["scholarships"] }
  )();
}
