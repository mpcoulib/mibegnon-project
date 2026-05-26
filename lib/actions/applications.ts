"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser, getAuthUser } from "@/lib/actions/user";

export async function createApplication(scholarshipId: string) {
  const user = await getAuthUser();
  if (!user) redirect("/connexion");

  await ensurePrismaUser();

  const scholarship = await prisma.scholarship.findUnique({
    where: { id: scholarshipId },
  });
  if (!scholarship) redirect("/bourses");

  const existing = await prisma.application.findFirst({
    where: { userId: user.id, scholarshipId },
  });

  if (!existing) {
    await prisma.application.create({
      data: {
        userId: user.id,
        scholarshipId,
        status: ApplicationStatus.INTERESSE,
        deadline: scholarship.deadline,
      },
    });
  }

  revalidatePath("/dashboard/candidatures");
  revalidatePath(`/bourses/${scholarshipId}`);
  redirect("/dashboard/candidatures");
}

export async function getApplications() {
  const user = await getAuthUser();
  if (!user) return [];

  return prisma.application.findMany({
    where: { userId: user.id },
    include: {
      scholarship: true,
      university: true,
      documents: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export type ApplicationWithRelations = Awaited<
  ReturnType<typeof getApplications>
>[number];

export async function deleteApplication(applicationId: string) {
  const user = await getAuthUser();
  if (!user) redirect("/connexion");

  await prisma.application.deleteMany({
    where: { id: applicationId, userId: user.id },
  });

  revalidatePath("/dashboard/candidatures");
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
) {
  const user = await getAuthUser();
  if (!user) redirect("/connexion");

  await prisma.application.updateMany({
    where: { id: applicationId, userId: user.id },
    data: { status },
  });

  revalidatePath("/dashboard/candidatures");
}

export async function addDocument(applicationId: string, name: string) {
  const user = await getAuthUser();
  if (!user) redirect("/connexion");

  const trimmed = name.trim();
  if (!trimmed) return;

  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId: user.id },
  });
  if (!app) return;

  await prisma.document.create({
    data: { applicationId, name: trimmed },
  });

  revalidatePath("/dashboard/candidatures");
}

export async function toggleDocument(documentId: string) {
  const user = await getAuthUser();
  if (!user) redirect("/connexion");

  const doc = await prisma.document.findFirst({
    where: { id: documentId, application: { userId: user.id } },
  });
  if (!doc) return;

  await prisma.document.update({
    where: { id: documentId },
    data: { isCompleted: !doc.isCompleted },
  });

  revalidatePath("/dashboard/candidatures");
}

export async function deleteDocument(documentId: string) {
  const user = await getAuthUser();
  if (!user) redirect("/connexion");

  const doc = await prisma.document.findFirst({
    where: { id: documentId, application: { userId: user.id } },
  });
  if (!doc) return;

  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath("/dashboard/candidatures");
}
