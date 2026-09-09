"use server";

import { revalidatePath } from "next/cache";
import { CoachingStage, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { BOARD_STAGES } from "@/lib/coaching/stages";

export type OpsResult =
  | { success: true; count?: number }
  | { success: false; error: string };

function normalizeCohort(raw: string | null | undefined): string | null {
  const c = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!c) return null;
  if (c.length > 60) throw new Error("Nom de cohorte trop long (60 caractères max).");
  return c;
}

function revalidateCoaching() {
  revalidatePath("/admin/accompagnement");
  revalidatePath("/admin/accompagnement/cohortes");
  revalidatePath("/admin/accompagnement/stats");
}

// ─── Cohortes ────────────────────────────────────────────────────────────────

/** Renomme une cohorte pour tous ses élèves. */
export async function renameCohort(formData: FormData): Promise<OpsResult> {
  await requireAdmin();
  const from = String(formData.get("from") ?? "").trim();
  let to: string | null;
  try {
    to = normalizeCohort(String(formData.get("to") ?? ""));
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
  if (!from) return { success: false, error: "Cohorte d'origine manquante." };
  if (!to) return { success: false, error: "Le nouveau nom ne peut pas être vide." };
  if (to === from) return { success: true, count: 0 };

  const res = await prisma.coachingLead.updateMany({
    where: { cohort: from },
    data: { cohort: to },
  });
  revalidateCoaching();
  return { success: true, count: res.count };
}

/**
 * Assigne tous les élèves sans cohorte (étapes du board uniquement, pas les archives)
 * à une cohorte. Utile après un lot d'inscriptions.
 */
export async function assignUnassignedToCohort(formData: FormData): Promise<OpsResult> {
  await requireAdmin();
  let cohort: string | null;
  try {
    cohort = normalizeCohort(String(formData.get("cohort") ?? ""));
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
  if (!cohort) return { success: false, error: "Nom de cohorte requis." };

  const res = await prisma.coachingLead.updateMany({
    where: { cohort: null, stage: { in: BOARD_STAGES } },
    data: { cohort },
  });
  revalidateCoaching();
  return { success: true, count: res.count };
}

/** Déplace tous les élèves d'une étape (et éventuellement d'une cohorte) vers une autre cohorte. */
export async function moveStageToCohort(formData: FormData): Promise<OpsResult> {
  await requireAdmin();
  const stageRaw = String(formData.get("stage") ?? "");
  const fromCohort = String(formData.get("fromCohort") ?? "").trim() || null;
  let cohort: string | null;
  try {
    cohort = normalizeCohort(String(formData.get("cohort") ?? ""));
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
  if (!cohort) return { success: false, error: "Nom de cohorte requis." };
  if (!(Object.values(CoachingStage) as string[]).includes(stageRaw)) {
    return { success: false, error: "Étape inconnue." };
  }

  const res = await prisma.coachingLead.updateMany({
    where: {
      stage: stageRaw as CoachingStage,
      ...(fromCohort ? { cohort: fromCohort } : {}),
    },
    data: { cohort },
  });
  revalidateCoaching();
  return { success: true, count: res.count };
}

// ─── Rôles ───────────────────────────────────────────────────────────────────

export async function setUserRole(userId: string, role: UserRole): Promise<OpsResult> {
  const admin = await requireAdmin();
  if (!(Object.values(UserRole) as string[]).includes(role)) {
    return { success: false, error: "Rôle inconnu." };
  }
  if (userId === admin.id && role !== UserRole.ADMIN) {
    return { success: false, error: "Tu ne peux pas retirer ton propre rôle admin." };
  }

  if (role !== UserRole.ADMIN) {
    const admins = await prisma.user.count({ where: { role: UserRole.ADMIN } });
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === UserRole.ADMIN && admins <= 1) {
      return { success: false, error: "Il doit rester au moins un admin." };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/utilisateurs");
  return { success: true };
}
