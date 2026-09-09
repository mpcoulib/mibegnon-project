import Link from "next/link";
import { KanbanSquare, ArrowLeft, ShieldCheck, BarChart3, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin/accompagnement", label: "Accompagnement", icon: KanbanSquare },
  { href: "/admin/accompagnement/stats", label: "Stats", icon: BarChart3 },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <svg viewBox="0 0 32 36" fill="none" className="h-7 w-7 text-[var(--gold)]" aria-hidden="true">
              <path d="M2 2H30V22Q30 34 16 34Q2 34 2 22Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <text x="8" y="25" fontSize="14" fontWeight="700" fill="currentColor" fontFamily="Georgia, serif">m</text>
            </svg>
            <span className="font-serif text-lg font-bold text-[var(--primary)]">mibegnon</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            <ShieldCheck size={12} className="text-[var(--gold)]" />
            Admin
          </span>
          <nav className="hidden sm:flex items-center gap-1 ml-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-secondary/50 hover:text-[var(--primary)] transition-colors"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:block">{admin.fullName}</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft size={14} />
            Espace élève
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
