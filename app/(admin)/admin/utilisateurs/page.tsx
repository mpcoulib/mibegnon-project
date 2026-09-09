import type { Metadata } from "next";
import Link from "next/link";
import { Prisma, UserRole } from "@prisma/client";
import { ShieldCheck, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { RoleToggle } from "@/components/admin/role-toggle";

export const metadata: Metadata = {
  title: "Utilisateurs — Admin Mibegnon",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default async function UtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string }>;
}) {
  const admin = await requireAdmin();
  const { q = "", page: pageRaw, role } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const query = q.trim();

  const where: Prisma.UserWhereInput = {
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { fullName: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(role === "ADMIN" ? { role: UserRole.ADMIN } : {}),
  };

  const [users, total, adminCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        coachingLead: { select: { id: true, stage: true } },
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) =>
    `/admin/utilisateurs?${new URLSearchParams({
      ...(query ? { q: query } : {}),
      ...(role ? { role } : {}),
      page: String(p),
    })}`;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary)]">Utilisateurs</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} compte{total > 1 ? "s" : ""} · {adminCount} admin{adminCount > 1 ? "s" : ""}
          </p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Email ou nom"
              className="rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm text-slate-800"
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="checkbox" name="role" value="ADMIN" defaultChecked={role === "ADMIN"} />
            Admins seulement
          </label>
          <button
            type="submit"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Rechercher
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {users.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-400">Aucun utilisateur.</li>
          )}
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  {u.fullName}
                  {u.role === UserRole.ADMIN && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      <ShieldCheck size={10} className="text-[var(--gold)]" /> Admin
                    </span>
                  )}
                  {u.id === admin.id && <span className="text-xs text-slate-400">(toi)</span>}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {u.email} · inscrit le {dateFmt.format(u.createdAt)}
                  {u.coachingLead && (
                    <>
                      {" · "}
                      <Link
                        href={`/admin/accompagnement/${u.coachingLead.id}`}
                        className="text-[var(--primary)] hover:underline"
                      >
                        accompagnement
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <RoleToggle userId={u.id} role={u.role} isSelf={u.id === admin.id} />
            </li>
          ))}
        </ul>
      </div>

      {pages > 1 && (
        <nav className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {page} / {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={link(page - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                Précédent
              </Link>
            )}
            {page < pages && (
              <Link href={link(page + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                Suivant
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
