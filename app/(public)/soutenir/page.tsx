import type { Metadata } from "next";
import { Heart, Server, Sparkles, Database } from "lucide-react";
import { DonateForm } from "@/components/donate-form";
import { DonateProgress } from "@/components/donate-progress";
import { DonateFaq } from "@/components/donate-faq";
import { DonatePageTracker } from "@/components/donate-page-tracker";

export const metadata: Metadata = {
  title: "Nous soutenir — Mibegnon",
  description:
    "Aide-nous à garder Mibegnon gratuit pour chaque élève ivoirien. Soutien sécurisé via Stripe.",
};

const COSTS = [
  {
    icon: Server,
    title: "Serveurs & données",
    desc: "Hébergement, base de données et disponibilité du site 24h/24.",
  },
  {
    icon: Sparkles,
    title: "Chao, l'IA conseiller",
    desc: "L'assistant qui guide les élèves sur les bourses — API sécurisée côté serveur.",
  },
  {
    icon: Database,
    title: "Bourses à jour",
    desc: "Collecte, traduction et vérification des opportunités pour la communauté.",
  },
] as const;

export default function SoutenirPage() {
  return (
    <div className="flex flex-col">
      <DonatePageTracker />

      <section className="bg-[var(--primary)] px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm mb-6">
            <Heart size={16} className="text-[var(--gold)]" />
            Mission communautaire
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Aide-nous à garder Mibegnon gratuit pour chaque élève ivoirien
          </h1>
          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            Pas de pub intrusive, pas de paywall sur les bourses. Ton soutien
            finance les vrais coûts : serveurs, données et l&apos;IA de Chao.
            On est ensemble 🇨🇮
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-8">
            <DonateProgress />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--primary)]">
                Choisis ton soutien
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chaque contribution compte, petite ou grande.
              </p>
              <div className="mt-6">
                <DonateForm />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[var(--primary)]">
                À quoi servent les dons ?
              </h2>
              <ul className="mt-4 space-y-4">
                {COSTS.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--orange)]/10 text-[var(--orange)]">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">{title}</p>
                      <p className="text-sm text-slate-500 leading-snug">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[var(--primary)] mb-3">
                Questions fréquentes
              </h2>
              <DonateFaq />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
