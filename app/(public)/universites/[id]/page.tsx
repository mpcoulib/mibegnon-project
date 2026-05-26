import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Trophy, BookOpen, DollarSign, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

const countryFlags: Record<string, string> = {
  France: "🇫🇷",
  Germany: "🇩🇪",
  Allemagne: "🇩🇪",
  "United Kingdom": "🇬🇧",
  "Royaume-Uni": "🇬🇧",
  UK: "🇬🇧",
  USA: "🇺🇸",
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Switzerland: "🇨🇭",
  Suisse: "🇨🇭",
  "South Africa": "🇿🇦",
  "Afrique du Sud": "🇿🇦",
};

function getFlag(country: string): string {
  return countryFlags[country] ?? "🌍";
}

function formatTuition(fee: number | null, currency: string): string {
  if (fee == null) return "Non précisés";
  return `${fee.toLocaleString("fr-FR")} ${currency}/an`;
}

export default async function UniversiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await prisma.university.findUnique({ where: { id } });

  if (!u) notFound();

  const flag = getFlag(u.country);
  const tuition = formatTuition(u.tuitionFee, u.tuitionCurrency);

  return (
    <div className="flex flex-col">
      <div className="bg-[var(--primary)] px-6 pt-6 pb-14 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/universites"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Toutes les universités
          </Link>
          {u.ranking && (
            <div className="flex items-center gap-1.5 mb-3">
              <Trophy size={14} className="text-[var(--gold)]" />
              <span className="text-sm font-medium text-[var(--gold)]">
                QS #{u.ranking} mondial
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold leading-snug max-w-3xl">
            {flag} {u.name}
          </h1>
          <p className="mt-2 text-white/70">
            {u.city}, {u.country}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 -mt-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Pays</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin size={13} className="text-[var(--orange)]" />
                  {u.country}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Ville</p>
                <p className="font-semibold text-slate-800">{u.city}</p>
              </div>
              {u.ranking && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Classement QS</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <Trophy size={13} className="text-[var(--gold)]" />
                    #{u.ranking}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">Frais approximatifs</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <DollarSign size={13} className="text-[var(--orange)]" />
                  {tuition}
                </p>
              </div>
            </div>

            {u.description && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-[var(--primary)] mb-3">
                  À propos
                </h2>
                <p className="text-slate-600 leading-relaxed">{u.description}</p>
              </div>
            )}

            {u.fields.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-[var(--primary)] mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-[var(--orange)]" />
                  Domaines d&apos;enseignement
                </h2>
                <div className="flex flex-wrap gap-2">
                  {u.fields.map((field) => (
                    <Badge key={field} variant="secondary" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-20">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
                Informations pratiques
              </p>

              <div className="space-y-3 mb-6 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Pays</span>
                  <span className="font-semibold text-slate-800">
                    {flag} {u.country}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ville</span>
                  <span className="font-semibold text-slate-800">{u.city}</span>
                </div>
                {u.ranking && (
                  <div className="flex justify-between">
                    <span>Classement QS</span>
                    <span className="font-semibold text-[var(--gold)]">#{u.ranking}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="shrink-0">Frais/an</span>
                  <span className="font-semibold text-slate-800 text-right text-xs">
                    {tuition}
                  </span>
                </div>
              </div>

              <Button
                asChild
                className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
              >
                <a
                  href={u.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  Site officiel
                  <ExternalLink size={14} />
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="mt-3 w-full border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10"
              >
                <Link href={`/bourses?pays=${encodeURIComponent(u.country)}`}>
                  Voir les bourses pour ce pays
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 bg-secondary/30 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-[var(--primary)]">
          Trouve une bourse pour étudier ici
        </p>
        <Button
          asChild
          className="mt-4 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
        >
          <Link href="/bourses">Explorer les bourses</Link>
        </Button>
      </div>
    </div>
  );
}
