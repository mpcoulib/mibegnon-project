import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { CoachingStage } from "@prisma/client";
import { getLeadDetail } from "@/lib/data/coaching";
import { signedFileUrl } from "@/lib/coaching/storage";
import {
  GENDER_LABEL,
  LEVEL_LABEL,
  STAGE_META,
  ageFrom,
  formatPhone,
  waLink,
} from "@/lib/coaching/stages";
import { LeadCard } from "@/components/admin/lead-card";
import { LeadOps } from "@/components/admin/lead-ops";
import { MessageComposer } from "@/components/admin/message-composer";
import { LeadNotes } from "@/components/admin/lead-notes";
import { LeadFiles } from "@/components/admin/lead-files";
import { CuratedEditor } from "@/components/admin/curated-editor";
import { ReceiptReviewForm } from "@/components/admin/receipt-review";
import { isSmsConfigured } from "@/lib/messaging/providers";

export const metadata: Metadata = {
  title: "Élève — Admin Mibegnon",
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadDetail(id);
  if (!lead) notFound();

  const meta = STAGE_META[lead.stage];
  const canInvite =
    lead.stage === CoachingStage.PAYE || lead.stage === CoachingStage.COMPTE_INVITE;

  const receipts = await Promise.all(
    lead.receipts.map(async (r) => ({
      ...r,
      url: await signedFileUrl(r.storagePath).catch(() => null),
    })),
  );
  const files = await Promise.all(
    lead.files.map(async (f) => ({
      ...f,
      url: await signedFileUrl(f.storagePath).catch(() => null),
    })),
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href="/admin/accompagnement"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--primary)]"
      >
        <ArrowLeft size={14} /> Retour au tableau
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary)]">{lead.fullName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {GENDER_LABEL[lead.gender]} · {ageFrom(lead.birthDate)} ans · {lead.city}
            {lead.cohort ? ` · ${lead.cohort}` : ""}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${meta.pill}`}>{meta.label}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profil</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-slate-400">Niveau</dt>
                <dd className="font-medium text-slate-800">
                  {LEVEL_LABEL[lead.educationLevel]}
                  {lead.serie ? ` ${lead.serie}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Établissement</dt>
                <dd className="font-medium text-slate-800">{lead.institution}</dd>
              </div>
              <div>
                <dt className="text-slate-400">WhatsApp</dt>
                <dd>
                  <a
                    href={waLink(lead.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
                  >
                    <MessageCircle size={14} /> {formatPhone(lead.phone)}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Parent</dt>
                <dd>
                  {lead.parentPhone ? (
                    <a
                      href={waLink(lead.parentPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
                    >
                      <MessageCircle size={14} /> {formatPhone(lead.parentPhone)}
                    </a>
                  ) : (
                    <span className="text-slate-400">non renseigné</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Email</dt>
                <dd className="font-medium text-slate-800">
                  {lead.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={14} className="text-slate-400" /> {lead.email}
                    </span>
                  ) : (
                    <span className="text-slate-400">non renseigné</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Référence paiement</dt>
                <dd className="font-mono font-semibold text-amber-900">{lead.paymentReference}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Montant</dt>
                <dd className="font-medium text-slate-800">
                  {lead.amountFcfa.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Compte Mibegnon</dt>
                <dd className="font-medium text-slate-800">
                  {lead.user ? lead.user.email : <span className="text-slate-400">pas encore créé</span>}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Inscrit le</dt>
                <dd className="font-medium text-slate-800">{dateFmt.format(lead.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Reçus Wave
            </h2>
            {receipts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Aucun reçu pour l&apos;instant.</p>
            ) : (
              <ul className="mt-4 space-y-6">
                {receipts.map((r) => (
                  <li key={r.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                    <p className="text-xs text-slate-400">
                      {dateFmt.format(r.createdAt)} · {r.decision}
                    </p>
                    {r.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.url}
                        alt="Reçu Wave"
                        className="mt-2 max-h-96 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
                      />
                    ) : (
                      <p className="mt-2 text-xs text-amber-800">
                        Image indisponible (vérifie SUPABASE_SERVICE_ROLE_KEY).
                      </p>
                    )}
                    {r.decision !== "EN_ATTENTE" && (
                      <p className="mt-2 text-xs text-slate-600">
                        {r.amountSeen ? `${r.amountSeen.toLocaleString("fr-FR")} FCFA` : ""}{" "}
                        {r.waveTxId ? `· ${r.waveTxId}` : ""}
                        {r.decisionNote ? ` · ${r.decisionNote}` : ""}
                      </p>
                    )}
                    <ReceiptReviewForm
                      receiptId={r.id}
                      amountFcfa={lead.amountFcfa}
                      awaitingReview={r.decision === "EN_ATTENTE"}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <CuratedEditor leadId={lead.id} items={lead.curated} />
        </div>

        <aside className="space-y-6">
          <LeadCard
            lead={{
              id: lead.id,
              fullName: lead.fullName,
              phone: lead.phone,
              parentPhone: lead.parentPhone,
              email: lead.email,
              birthDate: lead.birthDate,
              gender: lead.gender,
              city: lead.city,
              educationLevel: lead.educationLevel,
              institution: lead.institution,
              serie: lead.serie,
              stage: lead.stage,
              paymentReference: lead.paymentReference,
              amountFcfa: lead.amountFcfa,
              cohort: lead.cohort,
              userId: lead.userId,
              createdAt: lead.createdAt,
              updatedAt: lead.updatedAt,
              _count: lead._count,
            }}
          />
          <LeadOps
            leadId={lead.id}
            fullName={lead.fullName}
            phone={lead.phone}
            paymentReference={lead.paymentReference}
            amountFcfa={lead.amountFcfa}
            cohort={lead.cohort}
            canInvite={canInvite}
          />
          <MessageComposer
            leadId={lead.id}
            fullName={lead.fullName}
            paymentReference={lead.paymentReference}
            amountFcfa={lead.amountFcfa}
            hasParent={Boolean(lead.parentPhone)}
            smsConfigured={isSmsConfigured()}
            messages={lead.messages}
          />
          <LeadNotes leadId={lead.id} notes={lead.notes} />
          <LeadFiles leadId={lead.id} files={files} />

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Historique</h2>
            {lead.events.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Aucun changement d&apos;étape.</p>
            ) : (
              <ol className="mt-3 space-y-3 text-sm">
                {lead.events.map((e) => (
                  <li key={e.id} className="border-l-2 border-[var(--gold)]/60 pl-3">
                    <p className="text-slate-800">
                      {e.from ? `${STAGE_META[e.from].short} → ` : ""}
                      <span className="font-medium">{STAGE_META[e.to].short}</span>
                    </p>
                    <p className="text-xs text-slate-400">{dateFmt.format(e.createdAt)}</p>
                    {e.note && <p className="mt-1 text-xs text-slate-600">{e.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
