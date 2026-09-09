import { CoachingStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ARCHIVE_STAGES, BOARD_STAGES } from "@/lib/coaching/stages";

const boardLeadSelect = {
  id: true,
  fullName: true,
  phone: true,
  parentPhone: true,
  email: true,
  birthDate: true,
  gender: true,
  city: true,
  educationLevel: true,
  institution: true,
  serie: true,
  stage: true,
  paymentReference: true,
  amountFcfa: true,
  cohort: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { receipts: true, messages: true, files: true } },
} satisfies Prisma.CoachingLeadSelect;

export type BoardLead = Prisma.CoachingLeadGetPayload<{ select: typeof boardLeadSelect }>;

export type BoardData = {
  columns: Record<CoachingStage, BoardLead[]>;
  archiveCounts: Record<CoachingStage, number>;
  cohorts: string[];
};

/** Leads actifs groupés par étape + compteurs d'archives. Admin uniquement (appelant responsable). */
export async function getBoardData(cohort?: string): Promise<BoardData> {
  const where: Prisma.CoachingLeadWhereInput = cohort ? { cohort } : {};

  const [leads, archived, cohortRows] = await Promise.all([
    prisma.coachingLead.findMany({
      where: { ...where, stage: { in: BOARD_STAGES } },
      select: boardLeadSelect,
      orderBy: { createdAt: "asc" },
    }),
    prisma.coachingLead.groupBy({
      by: ["stage"],
      where: { ...where, stage: { in: ARCHIVE_STAGES } },
      _count: { _all: true },
    }),
    prisma.coachingLead.findMany({
      where: { cohort: { not: null } },
      select: { cohort: true },
      distinct: ["cohort"],
      orderBy: { cohort: "desc" },
    }),
  ]);

  const columns = Object.fromEntries(
    Object.values(CoachingStage).map((s) => [s, [] as BoardLead[]]),
  ) as Record<CoachingStage, BoardLead[]>;
  for (const lead of leads) columns[lead.stage].push(lead);

  const archiveCounts = Object.fromEntries(
    Object.values(CoachingStage).map((s) => [s, 0]),
  ) as Record<CoachingStage, number>;
  for (const row of archived) archiveCounts[row.stage] = row._count._all;

  return {
    columns,
    archiveCounts,
    cohorts: cohortRows.map((r) => r.cohort).filter((c): c is string => !!c),
  };
}

const ACTIVE_PHONE_STAGES: CoachingStage[] = [
  ...BOARD_STAGES,
];

export async function findActiveLeadByPhone(phone: string) {
  return prisma.coachingLead.findFirst({
    where: { phone, stage: { in: ACTIVE_PHONE_STAGES } },
    select: { id: true, paymentReference: true, stage: true },
  });
}

export async function getLeadByPaymentRef(ref: string) {
  return prisma.coachingLead.findUnique({
    where: { paymentReference: ref.toUpperCase() },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      stage: true,
      paymentReference: true,
      amountFcfa: true,
      receipts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, decision: true, createdAt: true },
      },
    },
  });
}

export async function getLeadDetail(id: string) {
  return prisma.coachingLead.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "desc" } },
      receipts: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      files: { orderBy: { createdAt: "desc" } },
      curated: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        include: {
          university: {
            select: { id: true, name: true, country: true, ranking: true, fields: true },
          },
          scholarship: {
            select: {
              id: true,
              name: true,
              provider: true,
              country: true,
              category: true,
              isFullFunding: true,
              deadline: true,
              academicLevels: true,
            },
          },
        },
      },
      activation: true,
      messages: { orderBy: { createdAt: "desc" }, take: 30 },
      user: { select: { id: true, email: true, fullName: true } },
      _count: { select: { receipts: true, messages: true, files: true } },
    },
  });
}

export type LeadDetail = NonNullable<Awaited<ReturnType<typeof getLeadDetail>>>;

export async function getStudentEnrollment(userId: string) {
  return prisma.coachingLead.findUnique({
    where: { userId },
    include: {
      notes: {
        where: { visibility: "PARTAGEE" },
        orderBy: { createdAt: "desc" },
      },
      files: { orderBy: { createdAt: "desc" } },
      curated: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        include: {
          university: {
            select: { id: true, name: true, country: true, ranking: true, fields: true },
          },
          scholarship: {
            select: {
              id: true,
              name: true,
              provider: true,
              country: true,
              category: true,
              isFullFunding: true,
              deadline: true,
              academicLevels: true,
            },
          },
        },
      },
    },
  });
}
