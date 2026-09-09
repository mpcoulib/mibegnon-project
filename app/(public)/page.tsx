import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Search, Send, Heart, ListChecks, MessageCircle, Users, ArrowRight } from "lucide-react";
import { ScholarshipCard } from "@/components/scholarship-card";
import { getFeaturedScholarships } from "@/lib/data/scholarships";

export const revalidate = 3600;

export default async function HomePage() {
  const featuredScholarships = await getFeaturedScholarships();

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative min-h-[600px] flex items-center">
        <Image
          src="/hero.jpeg"
          alt="Élève ivoirien levant la main en classe"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/90 via-[var(--primary)]/60 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24">
          <div className="max-w-xl">
            <Badge className="mb-5 bg-[var(--orange)] text-white hover:bg-[var(--orange)] border-0">
              Akwaba ! Gratuit pour tous les élèves ivoiriens
            </Badge>
            <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl">
              Ton avenir <br />
              <span className="text-[var(--gold)]">commence ici.</span>
            </h1>
            <p className="mt-5 text-lg text-white/80 max-w-md">
              Des centaines de bourses et d&apos;universités du monde entier,
              accessibles gratuitement à chaque élève de Côte d&apos;Ivoire.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8"
              >
                <Link href="/bourses">Explorer les bourses</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full bg-white/20 border border-white text-white hover:bg-white/30 font-semibold px-8"
              >
                <Link href="/universites">Voir les universités</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[var(--gold)] text-[var(--primary)] hover:bg-[var(--gold)]/90 font-semibold px-8"
              >
                <Link href="/accompagnement#inscription">Être accompagné(e)</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured scholarships ── */}
      <section className="bg-secondary/20 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-[var(--primary)]">
            Bourses disponibles maintenant
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Des opportunités vérifiées qui t&apos;attendent. Ne laisse pas passer ta chance.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {featuredScholarships.map((s, i) => (
              <ScholarshipCard key={s.id} scholarship={s} featured={i === 1} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              asChild
              variant="outline"
              className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 px-8"
            >
              <Link href="/bourses">Voir toutes les bourses →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-background px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-[var(--primary)]">
            Comment ça marche ?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Trois étapes simples pour transformer tes ambitions en réalité.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: 1,
                icon: User,
                title: "Crée ton profil",
                desc: "Remplis ton profil en quelques minutes avec tes informations académiques et tes ambitions.",
              },
              {
                step: 2,
                icon: Search,
                title: "Découvre les opportunités",
                desc: "Explore des centaines de bourses et universités qui correspondent à ton profil.",
              },
              {
                step: 3,
                icon: Send,
                title: "Postule facilement",
                desc: "Soumets tes candidatures directement via notre plateforme et suis leur progression.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <Card key={step} className="border border-slate-200 shadow-sm text-left">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--primary)] text-[var(--primary)] font-bold text-sm">
                      {step}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--orange)] text-[var(--orange)]">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="font-bold text-[var(--primary)]">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Accompagnement personnalisé ── */}
      <section className="relative overflow-hidden bg-[var(--primary)] px-6 py-20 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-[var(--gold)]/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
              Nouveau · Accompagnement
            </p>
            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
              Tu veux qu&apos;on te suive <span className="text-[var(--gold)]">personnellement</span> ?
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75 leading-relaxed">
              Le catalogue reste gratuit. Mais si tu es en Terminale et que tu veux une équipe
              qui prépare ta liste d&apos;universités et te suit jusqu&apos;aux admissions, on est là.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: ListChecks,
                  title: "Ta liste, faite main",
                  desc: "Universités et bourses choisies pour ton profil, ta série, tes moyens.",
                },
                {
                  icon: MessageCircle,
                  title: "Suivi sur WhatsApp",
                  desc: "Des conseils et des relances là où tu es vraiment, pas dans une boîte mail.",
                },
                {
                  icon: Users,
                  title: "Ta promotion",
                  desc: "Un groupe d'élèves qui visent la même chose que toi, animé par l'équipe.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Icon size={20} className="text-[var(--gold)]" />
                  <h3 className="mt-3 font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-white/65 leading-relaxed">{desc}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <div className="relative rounded-3xl border border-[var(--gold)]/30 bg-white p-8 text-[var(--foreground)] shadow-2xl">
              <div className="absolute -top-3 left-8 rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                Paiement unique
              </div>
              <p className="text-sm font-medium text-slate-500">Accompagnement personnalisé</p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-[var(--primary)]">2 000</span>
                <span className="text-lg font-semibold text-slate-600">FCFA</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">Payable par Wave. Pas d&apos;abonnement.</p>

              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Liste d&apos;universités et de bourses sur mesure
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Conseils personnalisés dans ton espace
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Groupe WhatsApp de ta promotion
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Suivi jusqu&apos;aux admissions
                </li>
              </ul>

              <Button
                asChild
                size="lg"
                className="mt-8 w-full rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 font-semibold"
              >
                <Link href="/accompagnement#inscription">
                  Je veux être accompagné(e)
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-slate-400">
                Paiement vérifié à la main par l&apos;équipe Mibegnon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Community support ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--orange)]/15 via-white to-[var(--primary)]/10 px-6 py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--orange)]/20 text-[var(--orange)]">
            <Heart size={28} aria-hidden />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
              Garde Mibegnon gratuit pour tous
            </h2>
            <p className="mt-2 text-slate-600 leading-relaxed max-w-xl">
              Mibegnon vit grâce à la communauté : serveurs, Chao et bourses à jour.
              Un petit soutien, un grand impact pour les élèves ivoiriens.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="shrink-0 rounded-full bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90 font-semibold px-8"
          >
            <Link href="/soutenir">Nous soutenir</Link>
          </Button>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-secondary/20 px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
    
          <h2 className="text-3xl font-bold text-[var(--primary)]">
            Prêt à commencer ton voyage vers l&apos;excellence ?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Rejoins des milliers d&apos;étudiants ivoiriens qui ont déjà trouvé leur bourse
            d&apos;études grâce à Mibegnon.
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--primary)]/70 italic">
            Ça va aller, on est ensemble. 🇨🇮
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 font-semibold px-8"
            >
              <Link href="/inscription">Créer mon compte gratuitement</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 font-semibold px-8"
            >
              <Link href="/bourses">En savoir plus</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
