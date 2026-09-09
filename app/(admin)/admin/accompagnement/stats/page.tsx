import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCoachingStats } from "@/lib/data/coaching-stats";
import { ALL_STAGES, BOARD_STAGES, STAGE_META, humanHours } from "@/lib/coaching/stages";
import { formatFcfa } from "@/lib/coaching/constants";

export const metadata: Metadata = {
  title: "Stats accompagnement — Admin Mibegnon",
  robots: { index: false, follow: false },
};

const pct = (v: number) => `${Math.round(v * 100)} %`;

function Bar({ value, max, className = "bg-[var(--primary)]" }: { value: number; max: number; className?: string }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${className}`} style={{ width: `${w}%` }} />
    </div>
  );
}

const weekFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export default async function StatsPage() {
  const s = await getCoachingStats(8);
  const maxStage = Math.max(1, ...ALL_STAGES.map((st) => s.byStage[st]));
  const maxWeek = Math.max(1, ...s.weeks.map((w) => w.signups));

  const kpis = [
    { label: "Demandes", value: s.total.toString(), hint: "toutes étapes" },
    { label: "Payés", value: s.paid.toString(), hint: `${pct(s.conversionPaid)} des demandes` },
    { label: "Actifs", value: s.activated.toString(), hint: `${pct(s.conversionActivated)} des payés` },
    { label: "Encaissé", value: formatFcfa(s.revenueFcfa), hint: "paiements confirmés" },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <Link
          href="/admin/accompagnement"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--primary)]"
        >
          <ArrowLeft size={14} /> Retour au tableau
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--primary)]">Statistiques</h1>
        <p className="mt-1 text-sm text-slate-500">Entonnoir, délais et cohortes de l&apos;accompagnement.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{k.label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--primary)]">{k.value}</p>
            <p className="mt-1 text-xs text-slate-500">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Élèves par étape</h2>
          <ul className="mt-4 space-y-3">
            {ALL_STAGES.map((st) => (
              <li key={st}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_META[st].pill}`}>
                    {STAGE_META[st].label}
                  </span>
                  <span className="font-semibold text-slate-700">{s.byStage[st]}</span>
                </div>
                <Bar
                  value={s.byStage[st]}
                  max={maxStage}
                  className={BOARD_STAGES.includes(st) ? "bg-[var(--primary)]" : "bg-slate-300"}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Temps médian par étape
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Entre l&apos;entrée et la sortie de l&apos;étape, d&apos;après l&apos;historique.
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {s.durations.map((d) => (
              <li key={d.stage} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{STAGE_META[d.stage].label}</span>
                <span className="text-right">
                  <span className="font-semibold text-slate-800">
                    {d.medianHours === null ? "—" : humanHours(Math.round(d.medianHours))}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    {d.samples} cas
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          8 dernières semaines
        </h2>
        <div className="mt-4 grid grid-cols-8 items-end gap-2 h-40">
          {s.weeks.map((w) => {
            const h = Math.round((w.signups / maxWeek) * 100);
            const hp = w.signups ? Math.round((w.paid / w.signups) * h) : 0;
            return (
              <div key={w.weekStart} className="flex flex-col items-center justify-end gap-1 h-full">
                <span className="text-[11px] font-semibold text-slate-600">{w.signups}</span>
                <div className="relative w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-[var(--primary)]/15"
                    style={{ height: `${Math.max(h, w.signups ? 4 : 0)}%` }}
                  />
                  <div
                    className="absolute bottom-0 w-full rounded-t-md bg-[var(--gold)]"
                    style={{ height: `${hp}%` }}
                    title={`${w.paid} payé${w.paid > 1 ? "s" : ""}`}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{weekFmt.format(new Date(w.weekStart))}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          <span className="inline-block h-2 w-2 rounded-sm bg-[var(--primary)]/15 mr-1" /> demandes ·{" "}
          <span className="inline-block h-2 w-2 rounded-sm bg-[var(--gold)] mr-1" /> paiements confirmés
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cohortes</h2>
        {s.cohorts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            Aucune cohorte.{" "}
            <Link href="/admin/accompagnement/cohortes" className="text-[var(--primary)] underline">
              En créer une
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {s.cohorts.map((c) => (
              <li key={c.cohort} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link
                  href={`/admin/accompagnement?cohort=${encodeURIComponent(c.cohort)}`}
                  className="font-medium text-[var(--primary)] hover:underline"
                >
                  {c.cohort}
                </Link>
                <span className="text-slate-600">
                  {c.total} demande{c.total > 1 ? "s" : ""} · {c.paid} payé{c.paid > 1 ? "s" : ""} ·{" "}
                  {c.active} actif{c.active > 1 ? "s" : ""}
                  <span className="ml-2 text-xs text-slate-400">
                    ({c.total ? pct(c.paid / c.total) : "—"} conversion)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {s.unassigned > 0 && (
          <p className="mt-3 text-xs text-amber-700">
            {s.unassigned} élève{s.unassigned > 1 ? "s" : ""} sans cohorte.{" "}
            <Link href="/admin/accompagnement/cohortes" className="underline">
              Assigner
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
