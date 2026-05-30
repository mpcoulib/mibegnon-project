"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const FAQ = [
  {
    q: "Où va mon argent ?",
    a: "Serveurs et base de données, API d'intelligence artificielle pour Chao (notre conseiller), et mise à jour des bourses pour les élèves. Mibegnon reste gratuit pour tous.",
  },
  {
    q: "Est-ce sécurisé ?",
    a: "Oui. Le paiement passe par Stripe (comme de nombreuses grandes plateformes). Nous ne stockons jamais ton numéro de carte sur nos serveurs.",
  },
  {
    q: "Puis-je annuler un don mensuel ?",
    a: "Oui, à tout moment depuis l'email de reçu Stripe ou en nous contactant. Aucun engagement caché.",
  },
  {
    q: "Pourquoi soutenir Mibegnon ?",
    a: "Parce que chaque élève ivoirien mérite d'accéder aux bourses sans barrière. Ton soutien finance l'infrastructure, pas des dividendes.",
  },
] as const;

export function DonateFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {FAQ.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-[var(--primary)] hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]"
              aria-expanded={isOpen}
            >
              {item.q}
              <ChevronDown
                size={18}
                className={cn("shrink-0 transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{item.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
