import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const REVALIDATE_SECONDS = 3600;

/** Max rows per list request (mobile / low-bandwidth cap). */
export const SCHOLARSHIP_LIST_PAGE_SIZE = 60;

export const scholarshipListSelect = {
  id: true,
  name: true,
  provider: true,
  country: true,
  category: true,
  isFullFunding: true,
  deadline: true,
  academicLevels: true,
} satisfies Prisma.ScholarshipSelect;

export type ScholarshipListItem = Prisma.ScholarshipGetPayload<{
  select: typeof scholarshipListSelect;
}>;

export interface ScholarshipListOptions {
  take?: number;
  cursor?: string;
}

function listCacheKey(
  where: Prisma.ScholarshipWhereInput,
  options?: ScholarshipListOptions
): string {
  return JSON.stringify({ where, options });
}

export function getScholarshipsForList(
  where: Prisma.ScholarshipWhereInput,
  options?: ScholarshipListOptions
) {
  const key = listCacheKey(where, options);
  const take = options?.take ?? SCHOLARSHIP_LIST_PAGE_SIZE;

  return unstable_cache(
    async () =>
      prisma.scholarship.findMany({
        where,
        select: scholarshipListSelect,
        take,
        ...(options?.cursor
          ? { cursor: { id: options.cursor }, skip: 1 }
          : {}),
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      }),
    ["scholarships-list", key],
    { revalidate: REVALIDATE_SECONDS, tags: ["scholarships"] }
  )();
}

export function getScholarshipListCount(where: Prisma.ScholarshipWhereInput) {
  const key = listCacheKey(where);
  return unstable_cache(
    async () => prisma.scholarship.count({ where }),
    ["scholarships-count", key],
    { revalidate: REVALIDATE_SECONDS, tags: ["scholarships"] }
  )();
}

export function getScholarshipById(id: string) {
  return unstable_cache(
    async () => {
      const row = await prisma.scholarship.findUnique({ where: { id } });
      if (!row?.isActive) return null;
      return row;
    },
    ["scholarship", id],
    { revalidate: REVALIDATE_SECONDS, tags: ["scholarships", `scholarship:${id}`] }
  )();
}

export function getFeaturedScholarships() {
  return unstable_cache(
    async () =>
      prisma.scholarship.findMany({
        where: { isActive: true, isTranslated: true },
        select: scholarshipListSelect,
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

export function getScholarshipIdsForStaticParams(limit = 200) {
  return unstable_cache(
    async () =>
      prisma.scholarship.findMany({
        where: { isActive: true, isTranslated: true },
        select: { id: true },
        orderBy: { updatedAt: "desc" },
        take: limit,
      }),
    ["scholarships-static-params", String(limit)],
    { revalidate: REVALIDATE_SECONDS, tags: ["scholarships"] }
  )();
}
