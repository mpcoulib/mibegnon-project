"use server";

import { CoachingStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/coaching/reference";
import { FILE_MAX_BYTES, FILE_MIME } from "@/lib/coaching/constants";
import { uploadPrivateFile } from "@/lib/coaching/storage";
import { FileKind, Uploader } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/actions/user";

export type ActivateResult =
  | { success: true }
  | { success: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function activateCoachingAccount(
  formData: FormData,
): Promise<ActivateResult> {
  const token = String(formData.get("token") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!token) return { success: false, error: "Lien invalide." };
  if (!EMAIL_RE.test(email)) {
    return { success: false, error: "Email requis — c'est ton identifiant Mibegnon." };
  }
  if (password.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { success: false, error: "Les mots de passe ne correspondent pas." };
  }

  const tokenHash = hashToken(token);
  const record = await prisma.activationToken.findUnique({
    where: { tokenHash },
    include: {
      lead: { select: { id: true, fullName: true, email: true, phone: true, userId: true, stage: true } },
    },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return { success: false, error: "Ce lien a expiré ou a déjà été utilisé." };
  }
  if (record.lead.userId) {
    return { success: false, error: "Cet espace est déjà lié à un compte. Connecte-toi." };
  }

  const admin = createAdminClient();
  let userId: string | null = null;

  if (admin) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || record.lead.fullName },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        const supabase = await createClient();
        const { data: signed, error: signErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signErr || !signed.user) {
          return {
            success: false,
            error: "Un compte existe déjà avec cet email. Connecte-toi, ou utilise le mot de passe de ce compte.",
          };
        }
        userId = signed.user.id;
      } else {
        return { success: false, error: error.message };
      }
    } else if (data.user) {
      userId = data.user.id;
      const supabase = await createClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) {
        console.error("[coaching] auto sign-in", signErr);
      }
    }
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || record.lead.fullName } },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return { success: false, error: "Impossible de créer le compte. Réessaie." };
  }

  const taken = await prisma.coachingLead.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (taken && taken.id !== record.leadId) {
    return {
      success: false,
      error: "Ce compte Mibegnon est déjà lié à un accompagnement.",
    };
  }

  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email,
      fullName: fullName || record.lead.fullName,
      phone: record.lead.phone,
    },
    update: {
      fullName: fullName || record.lead.fullName,
      phone: record.lead.phone,
    },
  });

  await prisma.$transaction([
    prisma.coachingLead.update({
      where: { id: record.leadId },
      data: {
        userId,
        email,
        stage: CoachingStage.ACTIF,
      },
    }),
    prisma.activationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.stageEvent.create({
      data: {
        leadId: record.leadId,
        from: record.lead.stage,
        to: CoachingStage.ACTIF,
        note: "Compte Mibegnon créé",
      },
    }),
  ]);

  revalidatePath("/admin/accompagnement");
  revalidatePath(`/admin/accompagnement/${record.leadId}`);
  revalidatePath("/dashboard/accompagnement");
  return { success: true };
}

export async function uploadStudentFile(formData: FormData): Promise<ActivateResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Connecte-toi." };

  const lead = await prisma.coachingLead.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!lead) return { success: false, error: "Aucun accompagnement lié à ce compte." };

  const label = String(formData.get("label") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "AUTRE");
  const file = formData.get("file");
  if (label.length < 2) return { success: false, error: "Nomme ton document." };
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choisis un fichier." };
  }
  if (file.size > FILE_MAX_BYTES) return { success: false, error: "8 Mo maximum." };
  if (!FILE_MIME.has(file.type)) {
    return { success: false, error: "JPEG, PNG, WebP ou PDF." };
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
  const storagePath = `files/${lead.id}/student-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    await uploadPrivateFile(storagePath, bytes, file.type);
  } catch (err) {
    console.error("[coaching] student file", err);
    return { success: false, error: "Upload impossible pour le moment." };
  }

  await prisma.coachingFile.create({
    data: {
      leadId: lead.id,
      uploadedBy: Uploader.STUDENT,
      kind,
      label,
      storagePath,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });
  revalidatePath("/dashboard/accompagnement");
  return { success: true };
}
