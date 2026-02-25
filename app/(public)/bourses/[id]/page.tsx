import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, GraduationCap, CalendarDays, Banknote, ExternalLink, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/save-button";
import { scholarships } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const typeLabel: Record<string, string> = {
  complete: "Bourse complète",
  partial: "Aide partielle",
  exchange: "Programme d'échange",
};

export default async function BourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scholarship = scholarships.find((s) => s.id === id);

  if (!scholarship) notFound();
  const s = scholarship;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isSaved = false;
  if (user) {
    const saved = await prisma.savedScholarship.findUnique({
      where: { userId_scholarshipId: { userId: user.id, scholarshipId: id } },
    });
    isSaved = !!saved;
  }

  return (
    <div className="flex flex-col">
      {/* Nav breadcrumb */}
      <div className="bg-[var(--primary)] px-6 pt-6 pb-14 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/bourses"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Toutes les bourses
          </Link>
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <Badge className="bg-white/20 text-white border-0">{typeLabel[s.type]}</Badge>
            {s.urgent && (
              <Badge className="bg-[var(--orange)] text-white border-0">
                toi tu connais oub!
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold leading-snug max-w-3xl">{s.name}</h1>
          <p className="mt-2 text-white/70">{s.provider}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-6xl px-6 -mt-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Left: details ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick stats card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Pays</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin size={13} className="text-[var(--orange)]" />
                  {s.flag} {s.country}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Niveau</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <GraduationCap size={13} className="text-[var(--orange)]" />
                  {s.levels.join(", ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Date limite</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <CalendarDays size={13} className="text-[var(--orange)]" />
                  {s.deadline}
                </p>
              </div>
              {s.amount && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Montant</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <Banknote size={13} className="text-[var(--orange)]" />
                    {s.amount}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[var(--primary)] mb-3">
                À propos de cette bourse
              </h2>
              <p className="text-slate-600 leading-relaxed">{s.description}</p>
            </div>

            {/* Fields */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[var(--primary)] mb-3 flex items-center gap-2">
                <BookOpen size={18} className="text-[var(--orange)]" />
                Filières concernées
              </h2>
              <div className="flex flex-wrap gap-2">
                {s.fields.map((field) => (
                  <Badge
                    key={field}
                    variant="secondary"
                    className="text-xs"
                  >
                    {field}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[var(--primary)] mb-3">
                Conditions d&apos;éligibilité
              </h2>
              <ul className="space-y-2">
                {s.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1 h-4 w-4 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Right: sidebar CTA ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-20">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
                Postuler
              </p>

              <div className="space-y-3 mb-6 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Date limite</span>
                  <span className="font-semibold text-slate-800">{s.deadline}</span>
                </div>
                {s.amount && (
                  <div className="flex justify-between">
                    <span>Montant</span>
                    <span className="font-semibold text-slate-800">{s.amount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="font-semibold text-slate-800">{typeLabel[s.type]}</span>
                </div>
              </div>

              <Button
                asChild
                className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
              >
                <a
                  href={s.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  Postuler maintenant
                  <ExternalLink size={14} />
                </a>
              </Button>

              <div className="mt-3 flex items-center gap-2">
                <SaveButton scholarshipId={s.id} isSaved={isSaved} />
                <span className="text-xs text-slate-400">
                  {isSaved ? "Sauvegardé dans tes favoris" : "Sauvegarder dans tes favoris"}
                </span>
              </div>

              <p className="mt-4 text-center text-xs text-slate-400">
                Mibegnon ne gère pas les candidatures directement.
                Tu seras redirigé vers le site officiel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 bg-secondary/30 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-[var(--primary)]">
          Explore d&apos;autres bourses
        </p>
        <Button asChild className="mt-4 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
          <Link href="/bourses">Voir toutes les bourses</Link>
        </Button>
      </div>
    </div>
  );
}
