import { CoachingStage, ReceiptDecision } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { COACHING_STORAGE_BUCKET } from "@/lib/coaching/constants";

/**
 * Rétention (voir /confidentialite §4.3) :
 * - demandes sans paiement (NOUVEAU, PAIEMENT_DEMANDE), rejetées ou injoignables : 90 j après la dernière mise à jour
 * - captures de reçu Wave confirmées : 12 mois après la confirmation
 * - reçus refusés : 90 j
 * - tokens d'activation expirés non utilisés : 30 j après expiration
 */
export const LEAD_RETENTION_DAYS = 90;
export const RECEIPT_RETENTION_DAYS = 365;
export const REFUSED_RECEIPT_RETENTION_DAYS = 90;
export const TOKEN_GRACE_DAYS = 30;

const PURGEABLE_STAGES: CoachingStage[] = [
  CoachingStage.NOUVEAU,
  CoachingStage.PAIEMENT_DEMANDE,
  CoachingStage.REJETE,
  CoachingStage.INJOIGNABLE,
];

export type PurgeResult = {
  leadsDeleted: number;
  receiptsDeleted: number;
  tokensDeleted: number;
  objectsDeleted: number;
  objectsFailed: number;
  storageSkipped: boolean; // service role absente → objets non supprimés
};

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 86_400_000);
}

async function deleteObjects(paths: string[]): Promise<{ deleted: number; failed: number; skipped: boolean }> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return { deleted: 0, failed: 0, skipped: false };

  const supabase = createAdminClient();
  if (!supabase) return { deleted: 0, failed: 0, skipped: true };

  let deleted = 0;
  let failed = 0;
  // Supabase accepte des lots ; on reste prudent avec 100 par appel.
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    const { data, error } = await supabase.storage.from(COACHING_STORAGE_BUCKET).remove(batch);
    if (error) {
      failed += batch.length;
      console.error("[coaching/purge] storage remove", error.message);
    } else {
      deleted += data?.length ?? 0;
      failed += batch.length - (data?.length ?? 0);
    }
  }
  return { deleted, failed, skipped: false };
}

export async function runCoachingPurge(now = new Date(), dryRun = false): Promise<PurgeResult> {
  const leadCutoff = daysAgo(now, LEAD_RETENTION_DAYS);
  const receiptCutoff = daysAgo(now, RECEIPT_RETENTION_DAYS);
  const refusedCutoff = daysAgo(now, REFUSED_RECEIPT_RETENTION_DAYS);
  const tokenCutoff = daysAgo(now, TOKEN_GRACE_DAYS);

  // 1. Leads à purger (avec leurs fichiers) — jamais un lead lié à un compte
  const leads = await prisma.coachingLead.findMany({
    where: { stage: { in: PURGEABLE_STAGES }, updatedAt: { lt: leadCutoff }, userId: null },
    select: {
      id: true,
      receipts: { select: { storagePath: true } },
      files: { select: { storagePath: true } },
    },
  });
  const leadIds = leads.map((l) => l.id);
  const leadPaths = leads.flatMap((l) => [
    ...l.receipts.map((r) => r.storagePath),
    ...l.files.map((f) => f.storagePath),
  ]);

  // 2. Reçus expirés sur des leads conservés
  const receipts = await prisma.paymentReceipt.findMany({
    where: {
      leadId: { notIn: leadIds.length ? leadIds : ["__none__"] },
      OR: [
        { decision: ReceiptDecision.CONFIRME, decidedAt: { lt: receiptCutoff } },
        { decision: ReceiptDecision.REFUSE, decidedAt: { lt: refusedCutoff } },
      ],
    },
    select: { id: true, storagePath: true },
  });

  // 3. Tokens expirés non utilisés
  const tokenWhere = { usedAt: null, expiresAt: { lt: tokenCutoff } };
  const tokensCount = dryRun ? await prisma.activationToken.count({ where: tokenWhere }) : 0;

  if (dryRun) {
    return {
      leadsDeleted: leadIds.length,
      receiptsDeleted: receipts.length,
      tokensDeleted: tokensCount,
      objectsDeleted: 0,
      objectsFailed: 0,
      storageSkipped: true,
    };
  }

  // Supprimer d'abord les objets (si ça échoue, on garde quand même la ligne DB ? non :
  // la ligne référence un objet qu'on ne peut pas relire ; on supprime la DB et on log l'échec).
  const objects = await deleteObjects([...leadPaths, ...receipts.map((r) => r.storagePath)]);

  const [receiptsRes, leadsRes, tokensRes] = await prisma.$transaction([
    prisma.paymentReceipt.deleteMany({ where: { id: { in: receipts.map((r) => r.id) } } }),
    prisma.coachingLead.deleteMany({ where: { id: { in: leadIds } } }),
    prisma.activationToken.deleteMany({ where: tokenWhere }),
  ]);

  return {
    leadsDeleted: leadsRes.count,
    receiptsDeleted: receiptsRes.count,
    tokensDeleted: tokensRes.count,
    objectsDeleted: objects.deleted,
    objectsFailed: objects.failed,
    storageSkipped: objects.skipped,
  };
}
