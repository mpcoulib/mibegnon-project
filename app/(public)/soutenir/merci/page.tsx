import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonateSuccessTracker } from "@/components/donate-success-tracker";

export const metadata: Metadata = {
  title: "Merci pour ton soutien — Mibegnon",
  robots: { index: false },
};

export default async function SoutenirMerciPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <DonateSuccessTracker sessionId={sessionId} />

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
        <Heart size={40} className="text-[var(--orange)]" fill="currentColor" />
      </div>

      <h1 className="mt-8 text-3xl font-bold text-[var(--primary)]">
        Merci mon petit ! 🙏
      </h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        Ton soutien aide à garder Mibegnon gratuit et accessible pour les élèves
        de Côte d&apos;Ivoire. Un reçu t&apos;a été envoyé par email si tu en as
        indiqué un.
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--primary)]/80 italic">
        On est ensemble. Ça va aller 🇨🇮
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          asChild
          className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
        >
          <Link href="/bourses">Explorer les bourses</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/soutenir" className="flex items-center gap-2">
            <Share2 size={16} />
            Parler de Mibegnon
          </Link>
        </Button>
      </div>

      {sessionId && (
        <p className="mt-8 text-xs text-slate-400">
          Référence : {sessionId.slice(0, 20)}…
        </p>
      )}
    </div>
  );
}
