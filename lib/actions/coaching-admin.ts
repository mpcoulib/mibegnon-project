"use server";

import { revalidatePath } from "next/cache";
import {
  CoachingStage,
  FileKind,
  NoteVisibility,
  ReceiptDecision,
  Uploader,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { ALL_STAGES } from "@/lib/coaching/stages";
import {
  ACTIVATION_TTL_DAYS,
  FILE_MAX_BYTES,
  FILE_MIME,
} from "@/lib/coaching/constants";
import { generateActivationToken, hashToken } from "@/lib/coaching/reference";
import { uploadPrivateFile } from "@/lib/coaching/storage";
import { activationPageUrl } from "@/lib/coaching/templates";
import { contactRoles, sendToStudent, type WaLink } from "@/lib/messaging/send";

export type ActionResult =
  | { success: true; activationUrl?: string }
  | { success: false; error: string };

export type ConfirmInviteResult =
  | {
      success: true;
      activationUrl: string;
      waFallback: string | null;
      waLinks: WaLink[];
      summary: string;
    }
  | { success: false; error: string };

function revalidateLead(leadId: string) {
  revalidatePath("/admin/accompagnement");
  revalidatePath(`/admin/accompagnement/${leadId}`);
  revalidatePath("/dashboard/accompagnement");
}

/**
 * Déplace un lead vers une autre étape et journalise l'événement.
 * Réservé aux admins.
 */
export async function moveLeadStage(
  leadId: string,
  to: CoachingStage,
  note?: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  if (!ALL_STAGES.includes(to)) {
    return { success: false, error: "Étape inconnue." };
  }

  const lead = await prisma.coachingLead.findUnique({
    where: { id: leadId },
    select: { id: true, stage: true },
  });
  if (!lead) return { success: false, error: "Élève introuvable." };
  if (lead.stage === to) return { success: true };

  await prisma.$transaction([
    prisma.coachingLead.update({
      where: { id: leadId },
      data: { stage: to },
    }),
    prisma.stageEvent.create({
      data: {
        leadId,
        from: lead.stage,
        to,
        byUserId: admin.id,
        note: note?.trim() || null,
      },
    }),
  ]);

  revalidateLead(leadId);
  return { success: true };
}

export async function updateLeadCohort(
  leadId: string,
  cohort: string,
): Promise<ActionResult> {
  await requireAdmin();
  const value = cohort.trim() || null;
  await prisma.coachingLead.update({
    where: { id: leadId },
    data: { cohort: value },
  });
  revalidateLead(leadId);
  return { success: true };
}

export async function reviewReceipt(input: {
  receiptId: string;
  decision: "CONFIRME" | "REFUSE";
  amountSeen?: string;
  waveTxId?: string;
  note?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: input.receiptId },
    include: { lead: { select: { id: true, stage: true } } },
  });
  if (!receipt) return { success: false, error: "Reçu introuvable." };
  if (receipt.decision !== ReceiptDecision.EN_ATTENTE) {
    return { success: false, error: "Ce reçu a déjà été traité." };
  }

  const amountSeen = input.amountSeen?.trim()
    ? Number.parseInt(input.amountSeen.replace(/\s/g, ""), 10)
    : null;
  if (input.decision === "CONFIRME" && (!amountSeen || amountSeen < 1)) {
    return { success: false, error: "Indique le montant vu sur la capture." };
  }

  const nextStage =
    input.decision === "CONFIRME"
      ? CoachingStage.PAYE
      : CoachingStage.PAIEMENT_DEMANDE;

  await prisma.$transaction([
    prisma.paymentReceipt.update({
      where: { id: receipt.id },
      data: {
        decision:
          input.decision === "CONFIRME"
            ? ReceiptDecision.CONFIRME
            : ReceiptDecision.REFUSE,
        amountSeen: Number.isFinite(amountSeen) ? amountSeen : null,
        waveTxId: input.waveTxId?.trim() || null,
        decisionNote: input.note?.trim() || null,
        decidedAt: new Date(),
        decidedBy: admin.id,
      },
    }),
    prisma.coachingLead.update({
      where: { id: receipt.leadId },
      data: { stage: nextStage },
    }),
    prisma.stageEvent.create({
      data: {
        leadId: receipt.leadId,
        from: receipt.lead.stage,
        to: nextStage,
        byUserId: admin.id,
        note:
          input.decision === "CONFIRME"
            ? "Paiement Wave confirmé"
            : input.note?.trim() || "Reçu refusé",
      },
    }),
  ]);

  revalidateLead(receipt.leadId);
  return { success: true };
}

/**
 * Confirme le reçu Wave, génère le lien d'activation et envoie « paiement confirmé ».
 * Un clic : Payé → Compte invité.
 */
export async function confirmReceiptAndInvite(input: {
  receiptId: string;
  amountSeen?: string;
  waveTxId?: string;
  note?: string;
}): Promise<ConfirmInviteResult> {
  const confirmed = await reviewReceipt({
    receiptId: input.receiptId,
    decision: "CONFIRME",
    amountSeen: input.amountSeen,
    waveTxId: input.waveTxId,
    note: input.note,
  });
  if (!confirmed.success) return confirmed;

  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: input.receiptId },
    select: { leadId: true },
  });
  if (!receipt) return { success: false, error: "Reçu introuvable." };

  const link = await createActivationLink(receipt.leadId);
  if (!link.success || !link.activationUrl) {
    return {
      success: false,
      error: link.success
        ? "Paiement confirmé, mais le lien d'activation n'a pas pu être créé."
        : `Paiement confirmé. ${link.error}`,
    };
  }

  const lead = await prisma.coachingLead.findUnique({
    where: { id: receipt.leadId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      parentPhone: true,
      email: true,
      paymentReference: true,
      amountFcfa: true,
    },
  });
  if (!lead) return { success: false, error: "Élève introuvable." };

  const admin = await requireAdmin();
  const result = await sendToStudent({
    lead,
    templateId: "paiement_confirme",
    vars: {
      fullName: lead.fullName,
      paymentReference: lead.paymentReference,
      amountFcfa: lead.amountFcfa,
      activationUrl: link.activationUrl,
    },
    roles: contactRoles(lead),
    sentBy: admin.id,
  });

  const smsSent = result.logs.filter((l) => l.channel === "SMS" && l.status === "sent").length;
  const waManual = result.logs.filter((l) => l.channel === "WHATSAPP" && l.status === "logged").length;
  const failed = result.logs.filter((l) => l.status === "failed").length;
  const summary = [
    "Paiement confirmé",
    smsSent ? `SMS envoyé${smsSent > 1 ? "s" : ""}` : null,
    waManual ? "WhatsApp : ouvre le lien ci-dessous" : null,
    failed ? `${failed} échec${failed > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  revalidateLead(lead.id);
  return {
    success: true,
    activationUrl: link.activationUrl,
    waFallback: result.waFallback,
    waLinks: result.waLinks,
    summary: summary || "Paiement confirmé, lien envoyé.",
  };
}

export async function createActivationLink(leadId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const lead = await prisma.coachingLead.findUnique({
    where: { id: leadId },
    select: { id: true, stage: true },
  });
  if (!lead) return { success: false, error: "Élève introuvable." };
  if (
    lead.stage !== CoachingStage.PAYE &&
    lead.stage !== CoachingStage.COMPTE_INVITE
  ) {
    return {
      success: false,
      error: "Confirme d'abord le paiement avant d'envoyer le lien.",
    };
  }

  const token = generateActivationToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.activationToken.upsert({
      where: { leadId },
      create: { leadId, tokenHash, expiresAt },
      update: { tokenHash, expiresAt, usedAt: null },
    }),
    prisma.coachingLead.update({
      where: { id: leadId },
      data: { stage: CoachingStage.COMPTE_INVITE },
    }),
    prisma.stageEvent.create({
      data: {
        leadId,
        from: lead.stage,
        to: CoachingStage.COMPTE_INVITE,
        byUserId: admin.id,
        note: "Lien d'activation généré",
      },
    }),
  ]);

  revalidateLead(leadId);
  return { success: true, activationUrl: activationPageUrl(token) };
}

export async function addCoachingNote(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const visibility =
    formData.get("visibility") === "PARTAGEE"
      ? NoteVisibility.PARTAGEE
      : NoteVisibility.PRIVEE;
  if (!leadId || body.length < 2) {
    return { success: false, error: "Écris une note." };
  }

  await prisma.coachingNote.create({
    data: { leadId, body, visibility, authorId: admin.id },
  });
  revalidateLead(leadId);
  return { success: true };
}

export async function addCuratedItem(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  const universityId = String(formData.get("universityId") ?? "").trim() || null;
  const scholarshipId = String(formData.get("scholarshipId") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const priority = Number.parseInt(String(formData.get("priority") ?? "0"), 10) || 0;

  if (!leadId || (!universityId && !scholarshipId)) {
    return { success: false, error: "Choisis une université ou une bourse." };
  }

  try {
    await prisma.curatedItem.create({
      data: { leadId, universityId, scholarshipId, comment, priority },
    });
  } catch {
    return { success: false, error: "Déjà dans la liste de cet élève." };
  }
  revalidateLead(leadId);
  return { success: true };
}

export async function removeCuratedItem(itemId: string, leadId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.curatedItem.delete({ where: { id: itemId } });
  revalidateLead(leadId);
  return { success: true };
}

export async function uploadAdminFile(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "AUTRE");
  const file = formData.get("file");

  if (!leadId || label.length < 2) {
    return { success: false, error: "Donne un nom au fichier." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choisis un fichier." };
  }
  if (file.size > FILE_MAX_BYTES) {
    return { success: false, error: "Fichier trop lourd (8 Mo max)." };
  }
  if (!FILE_MIME.has(file.type)) {
    return { success: false, error: "JPEG, PNG, WebP ou PDF uniquement." };
  }

  const kind = (Object.values(FileKind) as string[]).includes(kindRaw)
    ? (kindRaw as FileKind)
    : FileKind.AUTRE;

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
  const storagePath = `files/${leadId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    await uploadPrivateFile(storagePath, bytes, file.type);
  } catch (err) {
    console.error("[coaching] admin file", err);
    return { success: false, error: "Upload impossible pour le moment." };
  }

  await prisma.coachingFile.create({
    data: {
      leadId,
      uploadedBy: Uploader.ADMIN,
      kind,
      label,
      storagePath,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });
  revalidateLead(leadId);
  return { success: true };
}

export async function searchCatalog(query: string): Promise<{
  universities: { id: string; name: string; country: string }[];
  scholarships: { id: string; name: string; country: string }[];
}> {
  await requireAdmin();
  const q = query.trim();
  if (q.length < 2) return { universities: [], scholarships: [] };

  const [universities, scholarships] = await Promise.all([
    prisma.university.findMany({
      where: { isActive: true, name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, country: true },
      take: 8,
      orderBy: { name: "asc" },
    }),
    prisma.scholarship.findMany({
      where: { isActive: true, name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, country: true },
      take: 8,
      orderBy: { name: "asc" },
    }),
  ]);
  return { universities, scholarships };
}
