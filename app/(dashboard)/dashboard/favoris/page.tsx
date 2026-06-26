import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScholarshipCard } from "@/components/scholarship-card";
import { UniversityCard } from "@/components/university-card";
import { getBookmarks } from "@/lib/actions/bookmarks";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function FavorisPage() {
  const { scholarships, universities } = await getBookmarks();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const savedIds = user
    ? new Set(
        (
          await prisma.savedScholarship.findMany({
            where: { userId: user.id },
            select: { scholarshipId: true },
          })
        ).map((s) => s.scholarshipId)
      )
    : new Set<string>();

  const isEmpty = scholarships.length === 0 && universities.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary)]">Mes favoris</h1>
        <p className="mt-1 text-sm text-slate-500">
          Les bourses et universités que tu as sauvegardées.
        </p>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Bookmark size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="font-medium text-slate-600">Ijioh ! Aucune bourse sauvegardée encore</p>
          <p className="mt-1 text-sm text-slate-400">
            Explore les bourses et clique sur ❤ pour les sauvegarder ici. Ça va aller dêh !
          </p>
          <Button
            asChild
            size="sm"
            className="mt-5 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            <Link href="/bourses">Explorer les bourses</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {scholarships.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-[var(--primary)] mb-4">
                Bourses ({scholarships.length})
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {scholarships.map((s) => (
                  <ScholarshipCard
                    key={s.id}
                    scholarship={s}
                    initialSaved={savedIds.has(s.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {universities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-[var(--primary)] mb-4">
                Universités ({universities.length})
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {universities.map((u) => (
                  <UniversityCard key={u.id} university={u} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
