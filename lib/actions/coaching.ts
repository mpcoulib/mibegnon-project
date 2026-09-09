"use server";

import { after } from "next/server";
import { CoachingStage, EducationLevel, Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/request-ip";
import { rateLimitCoachingSubmit, rateLimitCoachingUpload } from "@/lib/rate-limit";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile/verify";
import {
  COACHING_AMOUNT_FCFA,
  COACHING_DEFAULT_COHORT,
  RECEIPT_MAX_BYTES,
  RECEIPT_MIME,
} from "@/lib/coaching/constants";
import { normalizeCiPhone } from "@/lib/coaching/phone";
import { generatePaymentReference } from "@/lib/coaching/reference";
import { uploadPrivateFile } from "@/lib/coaching/storage";
import { ARCHIVE_STAGES } from "@/lib/coaching/stages";
import { findActiveLeadByPhone } from "@/lib/data/coaching";
import {
  notifyPaymentRequested,
  notifyReceiptReceived,
} from "@/lib/actions/coaching-messages";

export type CoachingActionResult =
  | { success: true; paymentReference: string }
  | { success: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVELS = new Set<string>(Object.values(EducationLevel));
const GENDERS = new Set<string>(Object.values(Gender));

function parseBirthDate(raw: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const age = now.getUTCFullYear() - d.getUTCFullYear();
  if (age < 12 || age > 80) return null;
  if (d.getTime() > now.getTime()) return null;
  return d;
}

export async function submitCoachingLead(
  formData: FormData,
): Promise<CoachingActionResult> {
  const ip = await getRequestIp();
  const rate = await rateLimitCoachingSubmit(ip);
  if (!rate.success) {
    return {
      success: false,
      error: "Trop de tentatives depuis cette connexion. Réessaie dans une heure.",
    };
  }

  const turnstileToken = (formData.get("cf-turnstile-response") as string) ?? "";
  if (isTurnstileConfigured()) {
    const valid = await verifyTurnstileToken(turnstileToken, ip);
    if (!valid) {
      return { success: false, error: "Vérification anti-spam échouée. Réessaie." };
    }
  } else if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Inscription temporairement indisponible." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const birthRaw = String(formData.get("birthDate") ?? "").trim();
  const gender = String(formData.get("gender") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  const educationLevel = String(formData.get("educationLevel") ?? "");
  const institution = String(formData.get("institution") ?? "").trim();
  const serieRaw = String(formData.get("serie") ?? "").trim();
  const parentRaw = String(formData.get("parentPhone") ?? "").trim();
  const consent = formData.get("consent") === "on" || formData.get("consent") === "true";

  if (fullName.length < 2 || fullName.length > 120) {
    return { success: false, error: "Indique ton nom complet." };
  }
  const phone = normalizeCiPhone(phoneRaw);
  if (!phone) {
    return {
      success: false,
      error: "Numéro WhatsApp invalide. Utilise un numéro ivoirien à 10 chiffres (ex. 07 00 00 00 00).",
    };
  }
  const email = emailRaw || null;
  if (email && !EMAIL_RE.test(email)) {
    return { success: false, error: "Email invalide." };
  }
  const birthDate = parseBirthDate(birthRaw);
  if (!birthDate) {
    return { success: false, error: "Date de naissance invalide." };
  }
  if (!GENDERS.has(gender)) {
    return { success: false, error: "Choisis un genre." };
  }
  if (city.length < 2 || city.length > 80) {
    return { success: false, error: "Indique ta ville ou commune." };
  }
  if (!LEVELS.has(educationLevel)) {
    return { success: false, error: "Choisis ton niveau d'études." };
  }
  if (institution.length < 2 || institution.length > 120) {
    return { success: false, error: "Indique ton établissement." };
  }
  if (!consent) {
    return {
      success: false,
      error: "Il faut accepter les conditions et d'être contacté(e) sur WhatsApp.",
    };
  }

  let parentPhone: string | null = null;
  if (parentRaw) {
    parentPhone = normalizeCiPhone(parentRaw);
    if (!parentPhone) {
      return {
        success: false,
        error: "Numéro du parent invalide. 10 chiffres ivoiriens, ou laisse vide.",
      };
    }
    if (parentPhone === phone) parentPhone = null;
  }

  try {
    const existing = await findActiveLeadByPhone(phone);
    if (existing) {
      if (existing.stage === CoachingStage.NOUVEAU) {
        await prisma.$transaction([
          prisma.coachingLead.update({
            where: { id: existing.id },
            data: { stage: CoachingStage.PAIEMENT_DEMANDE },
          }),
          prisma.stageEvent.create({
            data: {
              leadId: existing.id,
              from: CoachingStage.NOUVEAU,
              to: CoachingStage.PAIEMENT_DEMANDE,
              note: "Instructions Wave (auto)",
            },
          }),
        ]);
        after(() => notifyPaymentRequested(existing.id));
      }
      return {
        success: true,
        paymentReference: existing.paymentReference,
      };
    }

    let paymentReference = generatePaymentReference();
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.coachingLead.findUnique({
        where: { paymentReference },
        select: { id: true },
      });
      if (!clash) break;
      paymentReference = generatePaymentReference();
    }

    const lead = await prisma.coachingLead.create({
      data: {
        fullName,
        phone,
        parentPhone,
        email,
        birthDate,
        gender: gender as Gender,
        city,
        educationLevel: educationLevel as EducationLevel,
        institution,
        serie: serieRaw || null,
        stage: CoachingStage.PAIEMENT_DEMANDE,
        paymentReference,
        amountFcfa: COACHING_AMOUNT_FCFA,
        cohort: COACHING_DEFAULT_COHORT,
        consentAt: new Date(),
        events: {
          create: [
            { to: CoachingStage.NOUVEAU, note: "Formulaire public" },
            {
              from: CoachingStage.NOUVEAU,
              to: CoachingStage.PAIEMENT_DEMANDE,
              note: "Instructions Wave (auto)",
            },
          ],
        },
      },
    });

    after(() => notifyPaymentRequested(lead.id));

    return { success: true, paymentReference: lead.paymentReference };
  } catch (err) {
    console.error("[coaching] submitCoachingLead", err);
    return {
      success: false,
      error: "Impossible d'enregistrer ta demande. Réessaie dans un moment.",
    };
  }
}

export async function uploadWaveReceipt(
  formData: FormData,
): Promise<CoachingActionResult> {
  const ip = await getRequestIp();
  const rate = await rateLimitCoachingUpload(ip);
  if (!rate.success) {
    return {
      success: false,
      error: "Trop d'envois. Réessaie un peu plus tard.",
    };
  }

  const ref = String(formData.get("paymentReference") ?? "")
    .trim()
    .toUpperCase();
  const file = formData.get("receipt");
  if (!ref || !(file instanceof File) || file.size === 0) {
    return { success: false, error: "Ajoute une capture d'écran du transfert Wave." };
  }
  if (file.size > RECEIPT_MAX_BYTES) {
    return { success: false, error: "L'image doit faire moins de 5 Mo." };
  }
  if (!RECEIPT_MIME.has(file.type)) {
    return { success: false, error: "Format accepté : JPEG, PNG ou WebP." };
  }

  try {
    const lead = await prisma.coachingLead.findUnique({
      where: { paymentReference: ref },
      select: { id: true, stage: true, paymentReference: true },
    });
    if (!lead) {
      return { success: false, error: "Référence introuvable." };
    }
    if (ARCHIVE_STAGES.includes(lead.stage)) {
      return { success: false, error: "Cette demande n'accepte plus de reçu." };
    }
    if (
      lead.stage === CoachingStage.PAYE ||
      lead.stage === CoachingStage.COMPTE_INVITE ||
      lead.stage === CoachingStage.ACTIF
    ) {
      return { success: true, paymentReference: lead.paymentReference };
    }

    const pending = await prisma.paymentReceipt.count({
      where: { leadId: lead.id, decision: "EN_ATTENTE" },
    });
    if (pending >= 3) {
      return {
        success: false,
        error: "On a déjà tes captures. On vérifie sous 24 h.",
      };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `receipts/${lead.id}/${Date.now()}.${ext}`;

    try {
      await uploadPrivateFile(storagePath, bytes, file.type);
    } catch (err) {
      console.error("[coaching] receipt upload", err);
      return {
        success: false,
        error: "Impossible d'enregistrer le reçu. Réessaie dans un moment.",
      };
    }

    const from = lead.stage;
    await prisma.$transaction([
      prisma.paymentReceipt.create({
        data: {
          leadId: lead.id,
          storagePath,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      }),
      prisma.coachingLead.update({
        where: { id: lead.id },
        data: { stage: CoachingStage.RECU_ENVOYE },
      }),
      prisma.stageEvent.create({
        data: {
          leadId: lead.id,
          from,
          to: CoachingStage.RECU_ENVOYE,
          note: "Reçu Wave uploadé",
        },
      }),
    ]);

    after(() => notifyReceiptReceived(lead.id));

    return { success: true, paymentReference: lead.paymentReference };
  } catch (err) {
    console.error("[coaching] uploadWaveReceipt", err);
    return {
      success: false,
      error: "Impossible d'enregistrer le reçu. Réessaie dans un moment.",
    };
  }
}
