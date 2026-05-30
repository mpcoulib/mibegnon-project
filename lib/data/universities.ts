import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const REVALIDATE_SECONDS = 3600;

function listCacheKey(where: Prisma.UniversityWhereInput): string {
  return JSON.stringify(where);
}

export function getUniversitiesForList(where: Prisma.UniversityWhereInput) {
  const key = listCacheKey(where);
  return unstable_cache(
    async () =>
      prisma.university.findMany({
        where,
        orderBy: { ranking: "asc" },
      }),
    ["universities-list", key],
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
