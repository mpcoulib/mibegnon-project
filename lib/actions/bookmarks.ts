"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser, getAuthUser } from "@/lib/actions/user";

export async function toggleBookmark(scholarshipId: string) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/connexion");
  }

  await ensurePrismaUser();

  const existing = await prisma.savedScholarship.findUnique({
    where: { userId_scholarshipId: { userId: user.id, scholarshipId } },
  });

  if (existing) {
    await prisma.savedScholarship.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedScholarship.create({
      data: { userId: user.id, scholarshipId },
    });
  }

  revalidatePath("/bourses");
  revalidatePath(`/bourses/${scholarshipId}`);
  revalidatePath("/dashboard/favoris");
}

export async function getBookmarks() {
  const user = await getAuthUser();
  if (!user) return { scholarships: [], universities: [] };

  const saved = await prisma.savedScholarship.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const scholarshipIds = saved.map((s) => s.scholarshipId);
  const scholarships =
    scholarshipIds.length > 0
      ? await prisma.scholarship.findMany({
          where: { id: { in: scholarshipIds } },
        })
      : [];

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id, universityId: { not: null } },
    include: { university: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    scholarships,
    universities: bookmarks
      .map((b) => b.university)
      .filter((u): u is NonNullable<typeof u> => u !== null),
  };
}
