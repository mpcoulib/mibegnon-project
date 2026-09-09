import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Clock, Layers, Users } from "lucide-react";
import { getBoardData } from "@/lib/data/coaching";
import { ARCHIVE_STAGES, BOARD_STAGES, STAGE_META, staleInfo } from "@/lib/coaching/stages";
import { LeadCard } from "@/components/admin/lead-card";
import { CopyPhonesButton } from "@/components/admin/copy-phones-button";

export const metadata: Metadata = {
  title: "Accompagnement — Admin Mibegnon",
  robots: { index: false, follow: false },
};

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function AdminAccompagnementPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string; relance?: string }>;
}) {
  const { cohort, relance } = await searchParams;
  const onlyStale = relance === "1";
  const { columns, archiveCounts, cohorts } = await getBoardData(cohort || undefined);

  const now = new Date();
  const total = BOARD_STAGES.reduce((n, s) => n + columns[s].length, 0);
  const archivedTotal = ARCHIVE_STAGES.reduce((n, s) => n + archiveCounts[s], 0);

  const staleCounts = { nous: 0, eleve: 0 };
  for (const s of BOARD_STAGES) {
    for (const lead of columns[s]) {
      const info = staleInfo(lead, now);
      if (info) staleCounts[info.who]++;
    }
  }
  const staleTotal = staleCounts.nous + staleCounts.eleve;

  const visible = Object.fromEntries(
    BOARD_STAGES.map((s) => [
      s,
      onlyStale ? columns[s].filter((l) => staleInfo(l, now)) : columns[s],
    ]),
  ) as typeof columns;
  const visibleTotal = BOARD_STAGES.reduce((n, s) => n + visible[s].length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary)]">Accompagnement</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} élève{total > 1 ? "s" : ""} en cours
            {archivedTotal > 0 && ` · ${archivedTotal} archivé${archivedTotal > 1 ? "s" : ""}`}
            {cohort && ` · ${cohort}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/accompagnement${qs({ cohort, relance: onlyStale ? undefined : "1" })}`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              onlyStale
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : staleTotal > 0
                  ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-slate-200 bg-white text-slate-400"
            }`}
            title={`${staleCounts.nous} à traiter par nous · ${staleCounts.eleve} à relancer côté élève`}
          >
            <Clock size={14} />
            À relancer
            {staleTotal > 0 && (
              <span className="rounded-full bg-amber-500/90 px-1.5 text-[11px] font-bold text-white">
                {staleTotal}
              </span>
            )}
          </Link>

          <form className="flex items-center gap-2" method="get">
            {onlyStale && <input type="hidden" name="relance" value="1" />}
            <label htmlFor="cohort" className="sr-only">
              Cohorte
            </label>
            <select
              id="cohort"
              name="cohort"
              defaultValue={cohort ?? ""}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
            >
              <option value="">Toutes les cohortes</option>
              {cohorts.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Filtrer
            </button>
          </form>

          <Link
            href="/admin/accompagnement/cohortes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Layers size={14} /> Cohortes
          </Link>
          <Link
            href="/admin/accompagnement/stats"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <BarChart3 size={14} /> Stats
          </Link>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="mx-auto text-slate-300" size={36} />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">Aucun élève pour l&apos;instant</h2>
          <p className="mt-1 text-sm text-slate-500">
            Les inscriptions au parcours d&apos;accompagnement apparaîtront ici, étape par étape.
          </p>
        </div>
      ) : onlyStale && visibleTotal === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Clock className="mx-auto text-emerald-400" size={36} />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">Rien à relancer</h2>
          <p className="mt-1 text-sm text-slate-500">Tout le monde est dans les délais. Ça va aller.</p>
        </div>
      ) : (
        <div className="-mx-4 sm:-mx-6 overflow-x-auto pb-4">
          <div className="flex gap-4 px-4 sm:px-6 min-w-max">
            {!onlyStale && staleTotal > 0 && (
              <section className="w-72 shrink-0" aria-label="À relancer">
                <header className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      À relancer
                    </span>
                    <span className="text-xs text-slate-400">{staleTotal}</span>
                  </div>
                </header>
                <p className="mb-3 text-[11px] leading-snug text-slate-400">
                  Sans mouvement trop longtemps — {staleCounts.nous} à toi, {staleCounts.eleve}{" "}
                  côté élève.
                </p>
                <div className="space-y-3 rounded-2xl bg-amber-50/70 p-2 min-h-24">
                  {BOARD_STAGES.flatMap((s) =>
                    columns[s]
                      .filter((l) => staleInfo(l, now))
                      .map((lead) => <LeadCard key={`stale-${lead.id}`} lead={lead} />),
                  )}
                </div>
              </section>
            )}
            {BOARD_STAGES.map((stage) => {
              const meta = STAGE_META[stage];
              const leads = visible[stage];
              return (
                <section key={stage} className="w-72 shrink-0" aria-label={meta.label}>
                  <header className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.pill}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400">{leads.length}</span>
                    </div>
                    <CopyPhonesButton phones={leads.map((l) => l.phone)} label="Numéros" />
                  </header>
                  <p className="mb-3 text-[11px] leading-snug text-slate-400">{meta.hint}</p>
                  <div className="space-y-3 rounded-2xl bg-slate-100/70 p-2 min-h-24">
                    {leads.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">—</p>
                    ) : (
                      leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {archivedTotal > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Archives :</span>
          {ARCHIVE_STAGES.filter((s) => archiveCounts[s] > 0).map((s) => (
            <Link
              key={s}
              href={`/admin/accompagnement/archives${qs({ stage: s, cohort })}`}
              className={`rounded-full px-2 py-0.5 font-medium ${STAGE_META[s].pill} hover:opacity-80`}
            >
              {STAGE_META[s].label} · {archiveCounts[s]}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
