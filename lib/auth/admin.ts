import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser, getAuthUser } from "@/lib/actions/user";

/**
 * Emails autorisés à devenir ADMIN au premier passage (bootstrap).
 * `ADMIN_EMAILS="a@b.ci,c@d.ci"`
 */
function bootstrapAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export type AdminUser = { id: string; email: string; fullName: string };

/**
 * Retourne l'admin courant ou `null`.
 * Promeut automatiquement en ADMIN un utilisateur listé dans ADMIN_EMAILS.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  const user = await ensurePrismaUser();
  if (!user) return null;

  if (user.role === UserRole.ADMIN) {
    return { id: user.id, email: user.email, fullName: user.fullName };
  }

  if (bootstrapAdminEmails().has(user.email.toLowerCase())) {
    const promoted = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });
    return { id: promoted.id, email: promoted.email, fullName: promoted.fullName };
  }

  return null;
}

/**
 * À appeler dans les layouts/pages/actions admin.
 * Non connecté → /connexion ; connecté non-admin → 404 (l'admin n'est pas annoncé).
 */
export async function requireAdmin(): Promise<AdminUser> {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/connexion");

  const admin = await getAdminUser();
  if (!admin) notFound();
  return admin;
}
