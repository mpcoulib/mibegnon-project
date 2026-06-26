import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const REVALIDATE_SECONDS = 3600;

export const UNIVERSITY_LIST_PAGE_SIZE = 60;

export const universityListSelect = {
  id: true,
  name: true,
  country: true,
  ranking: true,
  fields: true,
} satisfies Prisma.UniversitySelect;

export type UniversityListItem = Prisma.UniversityGetPayload<{
  select: typeof universityListSelect;
}>;

export interface UniversityListOptions {
  take?: number;
  cursor?: string;
}

function listCacheKey(
  where: Prisma.UniversityWhereInput,
  options?: UniversityListOptions
): string {
  return JSON.stringify({ where, options });
}

export function getUniversitiesForList(
  where: Prisma.UniversityWhereInput,
  options?: UniversityListOptions
) {
  const key = listCacheKey(where, options);
  const take = options?.take ?? UNIVERSITY_LIST_PAGE_SIZE;

  return unstable_cache(
    async () =>
      prisma.university.findMany({
        where,
        select: universityListSelect,
        take,
        ...(options?.cursor
          ? { cursor: { id: options.cursor }, skip: 1 }
          : {}),
        orderBy: [{ ranking: "asc" }, { id: "asc" }],
      }),
    ["universities-list", key],
    { revalidate: REVALIDATE_SECONDS, tags: ["universities"] }
  )();
}

export function getUniversityListCount(where: Prisma.UniversityWhereInput) {
  const key = listCacheKey(where);
  return unstable_cache(
    async () => prisma.university.count({ where }),
    ["universities-count", key],
    { revalidate: REVALIDATE_SECONDS, tags: ["universities"] }
  )();
}

export function getUniversityById(id: string) {
  return unstable_cache(
    async () => prisma.university.findUnique({ where: { id } }),
    ["university", id],
    { revalidate: REVALIDATE_SECONDS, tags: ["universities", `university:${id}`] }
  )();
}

export function getUniversityIdsForStaticParams(limit = 200) {
  return unstable_cache(
    async () =>
      prisma.university.findMany({
        where: { isActive: true },
        select: { id: true },
        orderBy: { updatedAt: "desc" },
        take: limit,
      }),
    ["universities-static-params", String(limit)],
    { revalidate: REVALIDATE_SECONDS, tags: ["universities"] }
  )();
}
