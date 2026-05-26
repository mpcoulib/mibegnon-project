"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EducationLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser, getAuthUser } from "@/lib/actions/user";

const EDUCATION_LEVELS = new Set<string>(Object.values(EducationLevel));

export async function updateProfile(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/connexion");

  await ensurePrismaUser();

  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const educationRaw = (formData.get("educationLevel") as string)?.trim();
  const fieldOfStudy = (formData.get("fieldOfStudy") as string)?.trim() || null;
  const gpaRaw = (formData.get("gpa") as string)?.trim();
  const targetCountriesRaw = (formData.get("targetCountries") as string)?.trim();
  const targetFieldsRaw = (formData.get("targetFields") as string)?.trim();

  if (!fullName) {
    redirect("/dashboard/profil?error=Le+nom+complet+est+requis");
  }

  const educationLevel =
    educationRaw && EDUCATION_LEVELS.has(educationRaw)
      ? (educationRaw as EducationLevel)
      : null;

  const gpa = gpaRaw ? parseFloat(gpaRaw) : null;
  const targetCountries = targetCountriesRaw
    ? targetCountriesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const targetFields = targetFieldsRaw
    ? targetFieldsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName,
      phone,
      city,
      educationLevel,
      fieldOfStudy,
      gpa: gpa !== null && !Number.isNaN(gpa) ? gpa : null,
      targetCountries,
      targetFields,
    },
  });

  revalidatePath("/dashboard/profil");
  redirect("/dashboard/profil?success=Profil+mis+à+jour");
}
