import { notFound } from "next/navigation";
import Link from "next/link";
import { Compass, MessageCircle, Paperclip } from "lucide-react";
import { ensurePrismaUser } from "@/lib/actions/user";
import { getStudentEnrollment } from "@/lib/data/coaching";
import { signedFileUrl } from "@/lib/coaching/storage";
import { COACHING_WHATSAPP_NUMBER } from "@/lib/coaching/constants";
import { FILE_KIND_LABEL, STAGE_META, waLink } from "@/lib/coaching/stages";
import { studentHelloMessage } from "@/lib/coaching/templates";
import { UniversityCard } from "@/components/university-card";
import { ScholarshipCard } from "@/components/scholarship-card";
import { StudentFileUpload } from "@/components/accompagnement/student-file-upload";
import { CoachingTimeline } from "@/components/accompagnement/timeline";
import { CoachingStage } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function StudentAccompagnementPage() {
  const user = await ensurePrismaUser();
  if (!user) notFound();

  const lead = await getStudentEnrollment(user.id);
  if (!lead) notFound();

  const files = await Promise.all(
    lead.files.map(async (f) => ({
      ...f,
      url: await signedFileUrl(f.storagePath).catch(() => null),
    })),
  );

  const teamWa = COACHING_WHATSAPP_NUMBER
    ? waLink(
        COACHING_WHATSAPP_NUMBER.startsWith("+")
          ? COACHING_WHATSAPP_NUMBER
          : `+${COACHING_WHATSAPP_NUMBER.replace(/\D/g, "")}`,
        studentHelloMessage(lead.fullName),
      )
    : null;

  const timeline =
    lead.stage === CoachingStage.ACTIF
      ? "group"
      : lead.stage === CoachingStage.COMPTE_INVITE
        ? "link"
        : "link";

  return (
    <div className="space-y-8 pb-16 md:pb-0">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
          Parcours guidé
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--primary)]">Mon accompagnement</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ta liste, tes documents, et les conseils de l&apos;équipe. Le catalogue public reste
          gratuit.
        </p>
        <span className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STAGE_META[lead.stage].pill}`}>
          {STAGE_META[lead.stage].label}
        </span>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Prochaine action
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          {lead.stage === CoachingStage.ACTIF
            ? "Regarde ta liste, envoie tes docs, et écris-nous si tu bloques."
            : STAGE_META[lead.stage].hint}
        </p>
        <div className="mt-4">
          <CoachingTimeline current={timeline} />
        </div>
        {teamWa && (
          <a
            href={teamWa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <MessageCircle size={16} /> Écrire à mon conseiller
          </a>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--primary)]">Ta liste</h2>
        {lead.curated.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Compass size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-600">Ta liste arrive</p>
            <p className="mt-1 text-sm text-slate-400">
              L&apos;équipe prépare tes universités. On t&apos;écrit dès que c&apos;est en ligne.
            </p>
          </div>
        ) : (
          <ul className="space-y-6">
            {lead.curated.map((item) => (
              <li key={item.id} className="space-y-2">
                {item.comment && (
                  <p className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-2 text-sm text-amber-950">
                    {item.comment}
                  </p>
                )}
                {item.university && <UniversityCard university={item.university} />}
                {item.scholarship && <ScholarshipCard scholarship={item.scholarship} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--primary)]">Conseils</h2>
        {lead.notes.length === 0 ? (
          <p className="text-sm text-slate-500">Pas encore de note partagée.</p>
        ) : (
          <ul className="space-y-3">
            {lead.notes.map((n) => (
              <li key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {n.createdAt.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-[var(--primary)]">Documents</h2>
          {files.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun fichier pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-2">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Paperclip size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">
                      {f.label}
                      <span className="ml-2 text-xs text-slate-400">{FILE_KIND_LABEL[f.kind]}</span>
                    </span>
                  </span>
                  {f.url ? (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-medium text-[var(--primary)] hover:underline"
                    >
                      Ouvrir
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <StudentFileUpload />
      </section>

      <p className="text-center text-xs text-slate-400">
        Envie d&apos;explorer le catalogue ?{" "}
        <Link href="/bourses" className="underline">
          Les bourses restent gratuites
        </Link>
        .
      </p>
    </div>
  );
}
