import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { CoachingTimeline } from "@/components/accompagnement/timeline";
import { CopyButton } from "@/components/accompagnement/copy-button";
import { ReceiptUpload } from "@/components/accompagnement/receipt-upload";
import { WaveTicket } from "@/components/accompagnement/wave-ticket";
import {
  COACHING_WHATSAPP_NUMBER,
  COACHING_WAVE_NAME,
  COACHING_WAVE_NUMBER,
} from "@/lib/coaching/constants";
import { CoachingStage } from "@prisma/client";
import { getLeadByPaymentRef } from "@/lib/data/coaching";
import { phoneDigits } from "@/lib/coaching/phone";
import { waLink } from "@/lib/coaching/stages";

export const metadata: Metadata = {
  title: "Paiement Wave — Accompagnement Mibegnon",
  robots: { index: false, follow: false },
};

function timelineFor(stage: CoachingStage, hasReceipt: boolean) {
  if (
    stage === CoachingStage.PAYE ||
    stage === CoachingStage.COMPTE_INVITE ||
    stage === CoachingStage.ACTIF
  ) {
    return "link" as const;
  }
  if (stage === CoachingStage.RECU_ENVOYE || hasReceipt) return "receipt" as const;
  return "wave" as const;
}

export default async function PaiementPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const lead = await getLeadByPaymentRef(decodeURIComponent(ref));
  if (!lead) notFound();

  const latest = lead.receipts[0];
  const alreadySent =
    latest?.decision === "EN_ATTENTE" ||
    lead.stage === CoachingStage.RECU_ENVOYE ||
    lead.stage === CoachingStage.PAYE ||
    lead.stage === CoachingStage.COMPTE_INVITE ||
    lead.stage === CoachingStage.ACTIF;

  const firstName = lead.fullName.split(/\s+/)[0] ?? lead.fullName;
  const hello = `Bonjour Mibegnon, c'est ${firstName}. Référence ${lead.paymentReference}.`;
  const teamWa = COACHING_WHATSAPP_NUMBER
    ? waLink(
        COACHING_WHATSAPP_NUMBER.startsWith("+")
          ? COACHING_WHATSAPP_NUMBER
          : `+225${phoneDigits(COACHING_WHATSAPP_NUMBER).slice(-10)}`,
        hello,
      )
    : null;

  return (
    <div className="flex flex-col">
      <section className="bg-[var(--primary)] px-6 py-14 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gold)]">
            Parcours guidé
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
            Akwaba {firstName}, envoie tes {lead.amountFcfa.toLocaleString("fr-FR")} FCFA
          </h1>
          <p className="mt-3 text-white/75">
            Mets <span className="font-mono text-[var(--gold)]">{lead.paymentReference}</span> dans
            le message Wave. On t&apos;envoie aussi les instructions sur WhatsApp. Ensuite, envoie
            la capture ci-dessous.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <WaveTicket
              amountFcfa={lead.amountFcfa}
              waveNumber={COACHING_WAVE_NUMBER}
              waveName={COACHING_WAVE_NAME}
              paymentReference={lead.paymentReference}
            />
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton value={lead.paymentReference} label="Copier la référence" />
              {COACHING_WAVE_NUMBER && (
                <CopyButton value={COACHING_WAVE_NUMBER} label="Copier le numéro Wave" />
              )}
            </div>
            <ReceiptUpload
              paymentReference={lead.paymentReference}
              alreadySent={alreadySent}
            />
            {teamWa && (
              <a
                href={teamWa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <MessageCircle size={16} /> Discute avec nous
              </a>
            )}
          </div>
          <aside className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Où tu en es
              </h2>
              <div className="mt-4">
                <CoachingTimeline
                  current={timelineFor(lead.stage, Boolean(latest))}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
