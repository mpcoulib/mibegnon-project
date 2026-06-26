import { Suspense } from "react";
import { BoursesScholarshipGrid } from "@/components/bourses-scholarship-grid";
import { BoursesFilters } from "@/components/bourses-filters";
import { categoryInfo } from "@/lib/category-info";
import {
  getScholarshipListCount,
  getScholarshipsForList,
} from "@/lib/data/scholarships";

export const revalidate = 3600;

export default async function BoursesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    niveau?: string;
    q?: string;
    category?: string;
    cursor?: string;
  }>;
}) {
  const params = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isActive: true,
    ivoirianEligible: true,
    isTranslated: true,
    ...(params.type === "funded" ? { isFullFunding: true } : {}),
    ...(params.type === "partial" ? { isFullFunding: false } : {}),
    ...(params.niveau ? { academicLevels: { has: params.niveau } } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { provider: { contains: params.q, mode: "insensitive" } },
            { country: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [scholarships, totalCount] = await Promise.all([
    getScholarshipsForList(where, { cursor: params.cursor }),
    getScholarshipListCount(where),
  ]);

  return (
    <div className="flex flex-col">
      <section className="bg-[var(--primary)] px-6 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-white/60 uppercase tracking-widest mb-2">
            Opportunités
          </p>
          <h1 className="text-4xl font-bold">Toutes les bourses</h1>
          <p className="mt-2 text-white/70">
            {totalCount} bourse{totalCount > 1 ? "s" : ""} disponible
            {totalCount > 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <Suspense fallback={<div className="h-24 rounded-xl bg-slate-100 animate-pulse" />}>
          <BoursesFilters />
        </Suspense>

        {params.category && categoryInfo[params.category] && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <div
              className="px-6 py-4 text-white"
              style={{ background: categoryInfo[params.category].bg }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
                Programme
              </p>
              <h2 className="text-lg font-bold">{categoryInfo[params.category].label}</h2>
            </div>
            <div className="bg-white px-6 py-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {categoryInfo[params.category].description}
              </p>
            </div>
          </div>
        )}

        <p className="mt-6 mb-4 text-sm text-slate-500">
          {scholarships.length} bourse{scholarships.length > 1 ? "s" : ""} affichée
          {scholarships.length > 1 ? "s" : ""}
          {totalCount > scholarships.length
            ? ` sur ${totalCount} (charge les plus récentes en priorité)`
            : ""}
        </p>

        {scholarships.length > 0 ? (
          <BoursesScholarshipGrid scholarships={scholarships} />
        ) : (
          <div className="mt-16 text-center">
            <p className="text-2xl">🔍</p>
            <p className="mt-3 font-semibold text-slate-700">Ijioh ! Aucun résultat dêh...</p>
            <p className="mt-1 text-sm text-slate-500">
              Essaie de modifier tes filtres ou de changer ta recherche. Ça va aller !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
