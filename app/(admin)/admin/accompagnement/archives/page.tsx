import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoachingStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ARCHIVE_STAGES, LEVEL_LABEL, STAGE_META, formatPhone } from "@/lib/coaching/stages";

export const metadata: Metadata = {
  title: "Archives — Admin Mibegnon",
  robots: { index: false, follow: false },
};

export default async function ArchivesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; cohort?: string }>;
}) {
  const { stage, cohort } = await searchParams;
  const stages = ARCHIVE_STAGES.includes(stage as CoachingStage)
    ? [stage as CoachingStage]
    : ARCHIVE_STAGES;

  const leads = await prisma.coachingLead.findMany({
    where: { stage: { in: stages }, ...(cohort ? { cohort } : {}) },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      educationLevel: true,
      institution: true,
      stage: true,
      paymentReference: true,
      cohort: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link
          href="/admin/accompagnement"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--primary)]"
        >
          <ArrowLeft size={14} /> Retour au tableau
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--primary)]">Archives</h1>
        <p className="mt-1 text-sm text-slate-500">
          {leads.length} élève{leads.length > 1 ? "s" : ""}
          {stages.length === 1 ? ` · ${STAGE_META[stages[0]].label}` : ""}
          {cohort ? ` · ${cohort}` : ""}
        </p>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-slate-500">Rien dans les archives.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {leads.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/accompagnement/${l.id}`}
                  className="font-medium text-sm text-[var(--primary)] hover:underline"
                >
                  {l.fullName}
                </Link>
                <p className="text-xs text-slate-500 truncate">
                  {LEVEL_LABEL[l.educationLevel]} · {l.institution} · {formatPhone(l.phone)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {l.cohort && <span className="text-slate-400">{l.cohort}</span>}
                <span className="font-mono text-[10px] text-slate-400">{l.paymentReference}</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${STAGE_META[l.stage].pill}`}>
                  {STAGE_META[l.stage].label}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
