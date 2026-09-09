import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/coaching/reference";
import { ActivateForm } from "@/components/accompagnement/activate-form";

export const metadata: Metadata = {
  title: "Activer mon espace — Mibegnon",
  robots: { index: false, follow: false },
};

export default async function ActiverPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const record = await prisma.activationToken.findUnique({
    where: { tokenHash: hashToken(decoded) },
    include: { lead: { select: { fullName: true, email: true, userId: true } } },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now() || record.lead.userId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-[var(--primary)]">Lien expiré</h1>
        <p className="mt-3 text-slate-600">
          Ce lien d&apos;activation n&apos;est plus valable. Écris-nous sur WhatsApp pour en
          recevoir un nouveau.
        </p>
      </div>
    );
  }

  const first = record.lead.fullName.split(/\s+/)[0] ?? record.lead.fullName;

  return (
    <div className="flex flex-col">
      <section className="bg-[var(--primary)] px-6 py-14 text-white">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gold)]">
            Paiement confirmé
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold">Akwaba {first}, crée ton espace</h1>
          <p className="mt-3 text-white/75">
            Un compte Mibegnon classique, plus l&apos;onglet Accompagnement. Le catalogue reste
            gratuit.
          </p>
        </div>
      </section>
      <div className="mx-auto w-full max-w-lg px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <ActivateForm
            token={decoded}
            fullName={record.lead.fullName}
            email={record.lead.email}
          />
        </div>
      </div>
    </div>
  );
}
