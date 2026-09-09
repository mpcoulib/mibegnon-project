import type { Metadata } from "next";
import Link from "next/link";
import { Compass, ListChecks, MessageCircle, Sparkles } from "lucide-react";
import { InterestForm } from "@/components/accompagnement/interest-form";
import { WaveTicket } from "@/components/accompagnement/wave-ticket";
import {
  COACHING_AMOUNT_FCFA,
  COACHING_WAVE_NAME,
  COACHING_WAVE_NUMBER,
  formatFcfa,
} from "@/lib/coaching/constants";

export const metadata: Metadata = {
  title: "Accompagnement — Mibegnon",
  description:
    "Parcours guidé : une liste d'universités faite pour toi, et une équipe qui te suit. 2 000 FCFA. Le catalogue de bourses reste gratuit.",
};

const PROMISES = [
  {
    icon: ListChecks,
    title: "Une liste faite pour toi",
    desc: "Universités et bourses choisies à la main selon ta série, ta ville et tes objectifs.",
  },
  {
    icon: MessageCircle,
    title: "Un suivi WhatsApp",
    desc: "On t'écrit, on relance, on t'ajoute au groupe de ta cohorte. Pas un chatbot impersonnel.",
  },
  {
    icon: Compass,
    title: "Un espace à part",
    desc: "Après paiement, ton compte Mibegnon gagne un onglet : ta liste, tes docs, les conseils.",
  },
] as const;

export default function AccompagnementPage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-[var(--primary)] px-6 py-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gold)]">
            Mibegnon Accompagnement
          </p>
          <div className="mx-auto mt-4 h-px w-16 bg-[var(--gold)]" />
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            {formatFcfa(COACHING_AMOUNT_FCFA)}. Une liste d&apos;universités faite pour toi, et une
            équipe qui te suit.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/75 leading-relaxed">
            Le catalogue de bourses reste gratuit pour tout le monde. Ici, c&apos;est un parcours
            payant : matching personnel, docs, et suivi jusqu&apos;à ta prochaine étape.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {PROMISES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Icon size={18} />
                  </span>
                  <h2 className="mt-3 text-sm font-semibold text-[var(--primary)]">{title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>

            <div
              id="inscription"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--gold)]" />
                  <h2 className="text-xl font-bold text-[var(--primary)]">Inscription</h2>
                </div>
                <Link
                  href="/connexion?next=/admin/accompagnement&email=info.masbourseci%40gmail.com"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Connexion admin
                </Link>
              </div>
              <InterestForm />
            </div>
          </div>

          <aside className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 self-start">
            <WaveTicket
              amountFcfa={COACHING_AMOUNT_FCFA}
              waveNumber={COACHING_WAVE_NUMBER}
              waveName={COACHING_WAVE_NAME}
              paymentReference="MBG-XXXXXX"
            />
            <p className="px-1 text-xs text-slate-500">
              Après le formulaire, tu reçois ta vraie référence (unique). Le catalogue{" "}
              <Link href="/bourses" className="underline">
                reste gratuit
              </Link>
              .
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
