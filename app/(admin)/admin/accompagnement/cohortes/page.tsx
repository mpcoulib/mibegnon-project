import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { getCohortOverview } from "@/lib/data/coaching-stats";
import { BOARD_STAGES, STAGE_META } from "@/lib/coaching/stages";
import { COACHING_DEFAULT_COHORT } from "@/lib/coaching/constants";
import { CopyPhonesButton } from "@/components/admin/copy-phones-button";
import {
  AssignUnassignedForm,
  MoveStageForm,
  RenameCohortInline,
} from "@/components/admin/cohort-forms";

export const metadata: Metadata = {
  title: "Cohortes — Admin Mibegnon",
  robots: { index: false, follow: false },
};

export default async function CohortesPage() {
  const { cohorts, unassigned } = await getCohortOverview();
  const names = cohorts.map((c) => c.cohort);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <Link
          href="/admin/accompagnement"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--primary)]"
        >
          <ArrowLeft size={14} /> Retour au tableau
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--primary)]">Cohortes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Une cohorte = un groupe WhatsApp. Copie les numéros d&apos;une cohorte pour les ajouter au
          groupe depuis ton téléphone.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Sans cohorte · {unassigned.total}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <AssignUnassignedForm
            cohorts={names}
            defaultCohort={names[0] ?? COACHING_DEFAULT_COHORT}
            count={unassigned.total}
          />
          <CopyPhonesButton phones={unassigned.phones} label="Numéros sans cohorte" />
        </div>
      </section>

      {cohorts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Layers className="mx-auto text-slate-300" size={32} />
          <p className="mt-3 text-sm text-slate-500">Aucune cohorte pour l&apos;instant.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {cohorts.map((c) => (
            <li key={c.cohort} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--primary)]">{c.cohort}</h3>
                  <p className="text-sm text-slate-500">
                    {c.total} élève{c.total > 1 ? "s" : ""} · {c.activePhones.length} actif
                    {c.activePhones.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CopyPhonesButton
                    phones={c.activePhones}
                    label="Numéros actifs"
                    className="border border-slate-200 bg-white px-2 py-1"
                  />
                  <CopyPhonesButton
                    phones={c.allPhones}
                    label="Tous les numéros"
                    className="border border-slate-200 bg-white px-2 py-1"
                  />
                  <RenameCohortInline cohort={c.cohort} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {BOARD_STAGES.filter((s) => c.byStage[s]).map((s) => (
                  <Link
                    key={s}
                    href={`/admin/accompagnement?cohort=${encodeURIComponent(c.cohort)}`}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_META[s].pill} hover:opacity-80`}
                  >
                    {STAGE_META[s].short} · {c.byStage[s]}
                  </Link>
                ))}
                {c.byStage.TERMINE && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_META.TERMINE.pill}`}>
                    Terminé · {c.byStage.TERMINE}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Déplacer une étape entière
        </h2>
        <p className="text-xs text-slate-500">
          Exemple : tous les élèves « Actif » de « Rentrée 2026 » vers « Rentrée 2026 — Groupe 2 »
          quand le premier groupe WhatsApp est plein.
        </p>
        <MoveStageForm cohorts={names} />
      </section>
    </div>
  );
}
