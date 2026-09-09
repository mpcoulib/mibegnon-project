"use server";

import { CoachingStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { createActivationLink } from "@/lib/actions/coaching-admin";
import { contactRoles, sendToStudent, type ToRole } from "@/lib/messaging/send";
import {
  TEMPLATE_IDS,
  TEMPLATE_META,
  type TemplateId,
} from "@/lib/messaging/templates";

export type SendMessageResult =
  | {
      success: true;
      waFallback: string | null;
      waLinks: { role: "student" | "parent"; url: string }[];
      summary: string;
    }
  | { success: false; error: string };

function revalidateLead(leadId: string) {
  revalidatePath("/admin/accompagnement");
  revalidatePath(`/admin/accompagnement/${leadId}`);
}

export async function sendLeadMessage(input: {
  leadId: string;
  templateId: string;
  customBody?: string;
  toParent?: boolean;
  toStudent?: boolean;
}): Promise<SendMessageResult> {
  const admin = await requireAdmin();
  const templateId = input.templateId as TemplateId;
  if (!TEMPLATE_IDS.includes(templateId)) {
    return { success: false, error: "Modèle inconnu." };
  }
  if (TEMPLATE_META[templateId].needsCustom && !(input.customBody ?? "").trim()) {
    return { success: false, error: "Écris le texte de la relance." };
  }

  const lead = await prisma.coachingLead.findUnique({
    where: { id: input.leadId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      parentPhone: true,
      email: true,
      stage: true,
      paymentReference: true,
      amountFcfa: true,
    },
  });
  if (!lead) return { success: false, error: "Élève introuvable." };

  const roles: ToRole[] = [];
  if (input.toStudent !== false) roles.push("student");
  if (input.toParent) roles.push("parent");
  if (roles.length === 0) return { success: false, error: "Choisis un destinataire." };

  let activationUrl: string | undefined;
  if (TEMPLATE_META[templateId].needsToken) {
    const link = await createActivationLink(lead.id);
    if (!link.success || !link.activationUrl) {
      return { success: false, error: link.success ? "Lien d'activation manquant." : link.error };
    }
    activationUrl = link.activationUrl;
  }

  const result = await sendToStudent({
    lead,
    templateId,
    vars: {
      fullName: lead.fullName,
      paymentReference: lead.paymentReference,
      amountFcfa: lead.amountFcfa,
      activationUrl,
      customBody: input.customBody,
    },
    roles,
    sentBy: admin.id,
  });

  if (templateId === "paiement_wave" && lead.stage === CoachingStage.NOUVEAU) {
    await prisma.$transaction([
      prisma.coachingLead.update({
        where: { id: lead.id },
        data: { stage: CoachingStage.PAIEMENT_DEMANDE },
      }),
      prisma.stageEvent.create({
        data: {
          leadId: lead.id,
          from: CoachingStage.NOUVEAU,
          to: CoachingStage.PAIEMENT_DEMANDE,
          byUserId: admin.id,
          note: "Instructions Wave envoyées",
        },
      }),
    ]);
  }

  revalidateLead(lead.id);

  const smsSent = result.logs.filter((l) => l.channel === "SMS" && l.status === "sent").length;
  const smsFailed = result.logs.filter((l) => l.channel === "SMS" && l.status === "failed").length;
  const waSent = result.logs.filter((l) => l.channel === "WHATSAPP" && l.status === "sent").length;
  const summary = [
    smsSent ? `SMS envoyé${smsSent > 1 ? "s" : ""}` : null,
    smsFailed ? "SMS en échec" : null,
    waSent ? `WhatsApp envoyé${waSent > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    success: true,
    waFallback: result.waFallback,
    waLinks: result.waLinks,
    summary: summary || "Rien à envoyer.",
  };
}

const AUTO_LEAD_SELECT = {
  id: true,
  fullName: true,
  phone: true,
  parentPhone: true,
  email: true,
  paymentReference: true,
  amountFcfa: true,
} as const;

/** Instructions Wave après le formulaire public (sans admin). */
export async function notifyPaymentRequested(leadId: string): Promise<void> {
  const lead = await prisma.coachingLead.findUnique({
    where: { id: leadId },
    select: AUTO_LEAD_SELECT,
  });
  if (!lead) return;
  try {
    await sendToStudent({
      lead,
      templateId: "paiement_wave",
      vars: {
        fullName: lead.fullName,
        paymentReference: lead.paymentReference,
        amountFcfa: lead.amountFcfa,
      },
      roles: contactRoles(lead),
      sentBy: null,
    });
  } catch (err) {
    console.error("[coaching] notifyPaymentRequested", err);
  }
}

/** Accusé automatique après upload de reçu (sans admin). */
export async function notifyReceiptReceived(leadId: string): Promise<void> {
  const lead = await prisma.coachingLead.findUnique({
    where: { id: leadId },
    select: AUTO_LEAD_SELECT,
  });
  if (!lead) return;
  try {
    await sendToStudent({
      lead,
      templateId: "recu_recu",
      vars: {
        fullName: lead.fullName,
        paymentReference: lead.paymentReference,
        amountFcfa: lead.amountFcfa,
      },
      roles: ["student"],
      sentBy: null,
    });
  } catch (err) {
    console.error("[coaching] notifyReceiptReceived", err);
  }
}
