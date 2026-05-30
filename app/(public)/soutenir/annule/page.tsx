import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DonateCancelTracker } from "@/components/donate-cancel-tracker";

export const metadata: Metadata = {
  title: "Paiement annulé — Mibegnon",
  robots: { index: false },
};

export default function SoutenirAnnulePage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <DonateCancelTracker />

      <h1 className="text-2xl font-bold text-[var(--primary)]">
        Paiement annulé
      </h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        Pas de souci — tu peux réessayer quand tu veux. Mibegnon reste gratuit
        pour tous les élèves.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          asChild
          className="rounded-full bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90"
        >
          <Link href="/soutenir">Revenir soutenir</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
