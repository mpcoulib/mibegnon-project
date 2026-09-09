import { MessageChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { waLink } from "@/lib/coaching/stages";
import {
  emailSubject,
  forParent,
  renderTemplate,
  type TemplateId,
  type TemplateVars,
} from "@/lib/messaging/templates";
import {
  isEmailConfigured,
  isSmsConfigured,
  isWhatsAppApiEnabled,
  sendEmail,
  sendSms,
  sendWhatsApp,
} from "@/lib/messaging/providers";

export type ToRole = "student" | "parent";

export function contactRoles(lead: { parentPhone: string | null }): ToRole[] {
  const roles: ToRole[] = ["student"];
  if (lead.parentPhone) roles.push("parent");
  return roles;
}

export type SendLog = { channel: MessageChannel; status: string; error?: string };

export type WaLink = { role: ToRole; url: string };

export type SendResult = {
  logs: SendLog[];
  /** Lien wa.me élève (ou parent s'il n'y a que lui) — optionnel, à ouvrir à la main */
  waFallback: string | null;
  waLinks: WaLink[];
};

type LeadContact = {
  id: string;
  fullName: string;
  phone: string;
  parentPhone: string | null;
  email: string | null;
};

export async function sendToStudent(input: {
  lead: LeadContact;
  templateId: TemplateId;
  vars: TemplateVars;
  roles: ToRole[];
  sentBy?: string | null;
}): Promise<SendResult> {
  const logs: SendLog[] = [];
  const waLinks: WaLink[] = [];

  for (const role of input.roles) {
    const phone = role === "parent" ? input.lead.parentPhone : input.lead.phone;
    if (!phone) {
      logs.push({
        channel: MessageChannel.SMS,
        status: "failed",
        error: role === "parent" ? "Pas de numéro parent." : "Pas de numéro.",
      });
      continue;
    }

    let body = renderTemplate(input.templateId, input.vars);
    if (!body) {
      return {
        logs: [{ channel: MessageChannel.SMS, status: "failed", error: "Message vide." }],
        waFallback: null,
        waLinks: [],
      };
    }
    if (role === "parent") body = forParent(body, input.lead.fullName);

    const result = await deliverSms({
      leadId: input.lead.id,
      toPhone: phone,
      toRole: role,
      body,
      templateId: input.templateId,
      sentBy: input.sentBy ?? null,
    });
    logs.push(...result.logs);
    waLinks.push({ role, url: result.waUrl });
  }

  if (isEmailConfigured() && input.lead.email) {
    const body = renderTemplate(input.templateId, input.vars);
    const mail = await sendEmail({
      to: input.lead.email,
      subject: emailSubject(input.templateId, input.vars),
      text: body,
    });
    await prisma.messageLog.create({
      data: {
        leadId: input.lead.id,
        channel: MessageChannel.EMAIL,
        templateId: input.templateId,
        body,
        toRole: "student",
        providerId: mail.ok ? mail.providerId : null,
        status: mail.ok ? "sent" : "failed",
        error: mail.ok ? null : mail.error,
        sentBy: input.sentBy ?? null,
      },
    });
    logs.push({
      channel: MessageChannel.EMAIL,
      status: mail.ok ? "sent" : "failed",
      error: mail.ok ? undefined : mail.error,
    });
  }

  await prisma.coachingLead.update({
    where: { id: input.lead.id },
    data: { updatedAt: new Date() },
  });

  const studentLink = waLinks.find((l) => l.role === "student");
  return {
    logs,
    waFallback: studentLink?.url ?? waLinks[0]?.url ?? null,
    waLinks,
  };
}

/** SMS Twilio en automatique. WhatsApp API seulement si TWILIO_WHATSAPP_API=true. */
async function deliverSms(input: {
  leadId: string;
  toPhone: string;
  toRole: ToRole;
  body: string;
  templateId: string;
  sentBy: string | null;
}): Promise<{ logs: SendLog[]; waUrl: string }> {
  const logs: SendLog[] = [];
  const waUrl = waLink(input.toPhone, input.body);

  if (isWhatsAppApiEnabled()) {
    const wa = await sendWhatsApp(input.toPhone, input.body);
    await prisma.messageLog.create({
      data: {
        leadId: input.leadId,
        channel: MessageChannel.WHATSAPP,
        templateId: input.templateId,
        body: input.body,
        toPhone: input.toPhone,
        toRole: input.toRole,
        providerId: wa.ok ? wa.providerId : null,
        status: wa.ok ? "sent" : "failed",
        error: wa.ok ? null : wa.error,
        sentBy: input.sentBy,
      },
    });
    logs.push({
      channel: MessageChannel.WHATSAPP,
      status: wa.ok ? "sent" : "failed",
      error: wa.ok ? undefined : wa.error,
    });
  }

  if (isSmsConfigured()) {
    const sms = await sendSms(input.toPhone, input.body);
    await prisma.messageLog.create({
      data: {
        leadId: input.leadId,
        channel: MessageChannel.SMS,
        templateId: input.templateId,
        body: input.body,
        toPhone: input.toPhone,
        toRole: input.toRole,
        providerId: sms.ok ? sms.providerId : null,
        status: sms.ok ? "sent" : "failed",
        error: sms.ok ? null : sms.error,
        sentBy: input.sentBy,
      },
    });
    logs.push({
      channel: MessageChannel.SMS,
      status: sms.ok ? "sent" : "failed",
      error: sms.ok ? undefined : sms.error,
    });
    return { logs, waUrl };
  }

  if (!isWhatsAppApiEnabled()) {
    await prisma.messageLog.create({
      data: {
        leadId: input.leadId,
        channel: MessageChannel.WHATSAPP,
        templateId: input.templateId,
        body: input.body,
        toPhone: input.toPhone,
        toRole: input.toRole,
        status: "logged",
        error: "SMS non configuré — envoi depuis WhatsApp (lien wa.me).",
        sentBy: input.sentBy,
      },
    });
    logs.push({ channel: MessageChannel.WHATSAPP, status: "logged" });
  }

  return { logs, waUrl };
}
