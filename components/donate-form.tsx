"use client";

import { useState, useTransition } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDonationCheckout } from "@/lib/actions/donate";
import {
  DONATION_MAX_CENTS,
  DONATION_MIN_CENTS,
  DONATION_TIERS_CENTS,
  TIER_IMPACT,
  formatEuro,
} from "@/lib/donate/constants";
import { trackDonate } from "@/lib/analytics/donate";
import { cn } from "@/lib/utils";

type Kind = "one_time" | "monthly";

export function DonateForm() {
  const [kind, setKind] = useState<Kind>("one_time");
  const [selectedCents, setSelectedCents] = useState<number>(1000);
  const [customEuro, setCustomEuro] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const customCents = customEuro
    ? Math.round(parseFloat(customEuro.replace(",", ".")) * 100)
    : null;
  const amountCents =
    customEuro.trim() !== "" && customCents && !Number.isNaN(customCents)
      ? customCents
      : selectedCents;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (amountCents < DONATION_MIN_CENTS || amountCents > DONATION_MAX_CENTS) {
      setError(
        `Choisis un montant entre ${DONATION_MIN_CENTS / 100} € et ${DONATION_MAX_CENTS / 100} €.`
      );
      return;
    }

    trackDonate("donate_start", { kind, amountCents });

    startTransition(async () => {
      const result = await createDonationCheckout({
        amountCents,
        kind,
        donorName: donorName || undefined,
        donorEmail: donorEmail || undefined,
        publicMessage: publicMessage || undefined,
        isAnonymous,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      window.location.href = result.url;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Kind toggle */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Fréquence</p>
        <div
          className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
          role="group"
          aria-label="Type de don"
        >
          {(
            [
              { id: "one_time" as const, label: "Une fois" },
              { id: "monthly" as const, label: "Chaque mois" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setKind(opt.id)}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                kind === opt.id
                  ? "bg-white text-[var(--primary)] shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              )}
              aria-pressed={kind === opt.id}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tiers */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Montant</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {DONATION_TIERS_CENTS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => {
                setSelectedCents(cents);
                setCustomEuro("");
              }}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                selectedCents === cents && !customEuro
                  ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]"
                  : "border-slate-200 bg-white hover:border-[var(--primary)]/40"
              )}
              aria-pressed={selectedCents === cents && !customEuro}
            >
              <span className="text-xl font-bold text-[var(--primary)]">
                {formatEuro(cents)}
              </span>
              <p className="mt-2 text-xs text-slate-600 leading-snug">
                {TIER_IMPACT[cents]}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="customAmount" className="text-slate-600">
            Montant libre (€)
          </Label>
          <Input
            id="customAmount"
            type="number"
            min={DONATION_MIN_CENTS / 100}
            max={DONATION_MAX_CENTS / 100}
            step="1"
            placeholder="Ex. 15"
            value={customEuro}
            onChange={(e) => setCustomEuro(e.target.value)}
            className="mt-1 max-w-[200px]"
          />
        </div>
      </div>

      {/* Optional identity */}
      <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-slate-300"
          />
          Don anonyme (ton nom n&apos;apparaîtra pas publiquement)
        </label>

        {!isAnonymous && (
          <>
            <div>
              <Label htmlFor="donorName">Prénom ou nom (optionnel)</Label>
              <Input
                id="donorName"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Kouamé"
                className="mt-1"
                maxLength={80}
              />
            </div>
            <div>
              <Label htmlFor="publicMessage">Message public (optionnel)</Label>
              <Input
                id="publicMessage"
                value={publicMessage}
                onChange={(e) => setPublicMessage(e.target.value)}
                placeholder="Bonne chance à tous les élèves !"
                className="mt-1"
                maxLength={280}
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="donorEmail">Email (pour le reçu Stripe)</Label>
          <Input
            id="donorEmail"
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            placeholder="toi@exemple.com"
            className="mt-1"
            autoComplete="email"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className="w-full rounded-xl bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90 text-base font-semibold py-6"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Redirection vers Stripe…
          </>
        ) : (
          <>
            {kind === "monthly" ? "Soutenir chaque mois" : "Faire un don"} —{" "}
            {formatEuro(amountCents)}
            {kind === "monthly" ? " / mois" : ""}
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Lock size={14} aria-hidden />
        Paiement sécurisé par Stripe · Reçu par email · Transparent
      </p>
    </form>
  );
}
