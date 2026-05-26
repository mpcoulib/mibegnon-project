"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function ensurePrismaUser() {
  const user = await getAuthUser();
  if (!user?.email) return null;

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email.split("@")[0];

  return prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      fullName,
    },
    update: {},
  });
}
