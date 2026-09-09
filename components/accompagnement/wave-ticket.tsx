import { formatFcfa } from "@/lib/coaching/constants";

export function WaveTicket({
  amountFcfa,
  waveNumber,
  waveName,
  paymentReference,
}: {
  amountFcfa: number;
  waveNumber: string;
  waveName: string;
  paymentReference: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--gold)]/40 bg-[var(--primary)] text-white shadow-lg">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--gold)]">
          Ticket Wave
        </p>
        <p className="mt-3 font-serif text-4xl font-bold">{formatFcfa(amountFcfa)}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
            <dt className="text-white/60">Bénéficiaire</dt>
            <dd className="font-medium">{waveName}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
            <dt className="text-white/60">Numéro Wave</dt>
            <dd className="font-mono">{waveNumber || "envoyé sur WhatsApp"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
            <dt className="text-white/60">Référence à coller</dt>
            <dd className="font-mono font-semibold text-[var(--gold)]">{paymentReference}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-white/70">
          Paiement Wave, vérifié à la main par l&apos;équipe Mibegnon. Mets la référence dans le
          message du transfert — c&apos;est comme ça qu&apos;on te retrouve.
        </p>
      </div>
    </div>
  );
}
