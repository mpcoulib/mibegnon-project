import { CoachingStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ALL_STAGES, BOARD_STAGES } from "@/lib/coaching/stages";

/** Étapes qui impliquent un paiement confirmé. */
export const PAID_STAGES: CoachingStage[] = [
  CoachingStage.PAYE,
  CoachingStage.COMPTE_INVITE,
  CoachingStage.ACTIF,
  CoachingStage.TERMINE,
];

const ACTIVATED_STAGES: CoachingStage[] = [CoachingStage.ACTIF, CoachingStage.TERMINE];

export type CohortRow = {
  cohort: string;
  total: number;
  paid: number;
  active: number;
  phones: string[]; // numéros des élèves ACTIF/TERMINE (pour le groupe WhatsApp)
};

export type CohortOverview = {
  cohort: string;
  total: number;
  byStage: Partial<Record<CoachingStage, number>>;
  allPhones: string[];
  activePhones: string[];
};

/** Vue cohortes pour la page de gestion : effectifs par étape + numéros. */
export async function getCohortOverview(): Promise<{
  cohorts: CohortOverview[];
  unassigned: { total: number; phones: string[] };
}> {
  const leads = await prisma.coachingLead.findMany({
    where: { stage: { notIn: [CoachingStage.REJETE, CoachingStage.INJOIGNABLE] } },
    select: { cohort: true, stage: true, phone: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, CohortOverview>();
  const unassigned = { total: 0, phones: [] as string[] };
  for (const l of leads) {
    if (!l.cohort) {
      unassigned.total++;
      unassigned.phones.push(l.phone);
      continue;
    }
    const row =
      map.get(l.cohort) ?? { cohort: l.cohort, total: 0, byStage: {}, allPhones: [], activePhones: [] };
    row.total++;
    row.byStage[l.stage] = (row.byStage[l.stage] ?? 0) + 1;
    row.allPhones.push(l.phone);
    if (ACTIVATED_STAGES.includes(l.stage)) row.activePhones.push(l.phone);
    map.set(l.cohort, row);
  }

  return {
    cohorts: Array.from(map.values()).sort((a, b) => b.cohort.localeCompare(a.cohort)),
    unassigned,
  };
}

export type StageDuration = { stage: CoachingStage; medianHours: number | null; samples: number };

export type WeekPoint = { weekStart: string; signups: number; paid: number };

export type CoachingStats = {
  byStage: Record<CoachingStage, number>;
  total: number;
  paid: number;
  activated: number;
  revenueFcfa: number;
  conversionPaid: number; // 0..1
  conversionActivated: number; // 0..1 (parmi les payés)
  durations: StageDuration[];
  weeks: WeekPoint[];
  cohorts: CohortRow[];
  unassigned: number;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function startOfWeek(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7; // lundi = 0
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

export async function getCoachingStats(weeksBack = 8): Promise<CoachingStats> {
  const since = startOfWeek(new Date());
  since.setUTCDate(since.getUTCDate() - 7 * (weeksBack - 1));

  const [stageRows, leads, paidEvents, activatedEvents, events] = await Promise.all([
    prisma.coachingLead.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.coachingLead.findMany({
      select: { id: true, stage: true, cohort: true, phone: true, amountFcfa: true, createdAt: true },
    }),
    // premier passage en PAYE par lead
    prisma.stageEvent.findMany({
      where: { to: CoachingStage.PAYE },
      select: { leadId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.stageEvent.findMany({
      where: { to: CoachingStage.ACTIF },
      select: { leadId: true },
      distinct: ["leadId"],
    }),
    prisma.stageEvent.findMany({
      select: { leadId: true, from: true, to: true, createdAt: true },
      orderBy: [{ leadId: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const byStage = Object.fromEntries(ALL_STAGES.map((s) => [s, 0])) as Record<CoachingStage, number>;
  for (const r of stageRows) byStage[r.stage] = r._count._all;

  const total = leads.length;

  // Payé = a un événement → PAYE, ou est actuellement dans une étape payée (rattrapage si créé à la main)
  const firstPaidAt = new Map<string, Date>();
  for (const e of paidEvents) if (!firstPaidAt.has(e.leadId)) firstPaidAt.set(e.leadId, e.createdAt);
  const paidIds = new Set<string>(firstPaidAt.keys());
  for (const l of leads) if (PAID_STAGES.includes(l.stage)) paidIds.add(l.id);

  const activatedIds = new Set<string>(activatedEvents.map((e) => e.leadId));
  for (const l of leads) if (ACTIVATED_STAGES.includes(l.stage)) activatedIds.add(l.id);

  const paid = paidIds.size;
  const activated = activatedIds.size;
  const revenueFcfa = leads.filter((l) => paidIds.has(l.id)).reduce((n, l) => n + l.amountFcfa, 0);

  // Durée médiane passée dans chaque étape (entre deux événements consécutifs d'un même lead)
  const durationsByStage = new Map<CoachingStage, number[]>();
  let prev: { leadId: string; to: CoachingStage; at: Date } | null = null;
  for (const e of events) {
    if (prev && prev.leadId === e.leadId && e.from === prev.to) {
      const hours = (e.createdAt.getTime() - prev.at.getTime()) / 3_600_000;
      const arr = durationsByStage.get(prev.to) ?? [];
      arr.push(hours);
      durationsByStage.set(prev.to, arr);
    }
    prev = { leadId: e.leadId, to: e.to, at: e.createdAt };
  }
  // Étape NOUVEAU : du createdAt du lead au premier événement
  const createdAt = new Map(leads.map((l) => [l.id, l.createdAt]));
  const firstEventAt = new Map<string, Date>();
  for (const e of events) if (!firstEventAt.has(e.leadId)) firstEventAt.set(e.leadId, e.createdAt);
  const nouveau: number[] = [];
  for (const [leadId, at] of firstEventAt) {
    const c = createdAt.get(leadId);
    if (c) nouveau.push((at.getTime() - c.getTime()) / 3_600_000);
  }
  durationsByStage.set(CoachingStage.NOUVEAU, [
    ...nouveau,
    ...(durationsByStage.get(CoachingStage.NOUVEAU) ?? []),
  ]);

  const durations: StageDuration[] = BOARD_STAGES.map((stage) => {
    const arr = durationsByStage.get(stage) ?? [];
    return { stage, medianHours: median(arr), samples: arr.length };
  });

  // Semaines
  const weekMap = new Map<string, WeekPoint>();
  for (let i = 0; i < weeksBack; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + 7 * i);
    const key = d.toISOString().slice(0, 10);
    weekMap.set(key, { weekStart: key, signups: 0, paid: 0 });
  }
  for (const l of leads) {
    if (l.createdAt >= since) {
      const key = startOfWeek(l.createdAt).toISOString().slice(0, 10);
      const w = weekMap.get(key);
      if (w) w.signups++;
    }
  }
  for (const [, at] of firstPaidAt) {
    if (at >= since) {
      const key = startOfWeek(at).toISOString().slice(0, 10);
      const w = weekMap.get(key);
      if (w) w.paid++;
    }
  }

  // Cohortes
  const cohortMap = new Map<string, CohortRow>();
  let unassigned = 0;
  for (const l of leads) {
    if (!l.cohort) {
      unassigned++;
      continue;
    }
    const row =
      cohortMap.get(l.cohort) ?? { cohort: l.cohort, total: 0, paid: 0, active: 0, phones: [] };
    row.total++;
    if (paidIds.has(l.id)) row.paid++;
    if (ACTIVATED_STAGES.includes(l.stage)) {
      row.active++;
      row.phones.push(l.phone);
    }
    cohortMap.set(l.cohort, row);
  }

  return {
    byStage,
    total,
    paid,
    activated,
    revenueFcfa,
    conversionPaid: total ? paid / total : 0,
    conversionActivated: paid ? activated / paid : 0,
    durations,
    weeks: Array.from(weekMap.values()),
    cohorts: Array.from(cohortMap.values()).sort((a, b) => b.cohort.localeCompare(a.cohort)),
    unassigned,
  };
}
