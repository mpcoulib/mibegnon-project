"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EducationLevel, Gender } from "@prisma/client";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { TurnstileField } from "@/components/turnstile-field";
import { submitCoachingLead } from "@/lib/actions/coaching";
import { IVORY_CITIES, SERIES } from "@/lib/coaching/constants";
import { ageFrom, GENDER_FULL, LEVEL_LABEL } from "@/lib/coaching/stages";
import { cn } from "@/lib/utils";

const STEPS = ["Toi", "Contact", "Études"] as const;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

function WhatsAppInput({
  id,
  name,
  required,
  autoComplete,
}: {
  id: string;
  name: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20">
      <span
        className="flex shrink-0 items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600"
        title="Indicatif Côte d'Ivoire"
      >
        <span aria-hidden>🇨🇮</span>
        <span>+225</span>
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        required={required}
        autoComplete={autoComplete}
        placeholder="07 00 00 00 00"
        aria-describedby={`${id}-hint`}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none"
      />
    </div>
  );
}
export function InterestForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const turnstileRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const under18 = useMemo(() => {
    if (!birthDate) return false;
    const d = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    return ageFrom(d) < 18;
  }, [birthDate]);

  function validateStep(form: HTMLFormElement, index: number): string | null {
    const data = new FormData(form);
    if (index === 0) {
      if (String(data.get("fullName") ?? "").trim().length < 2) return "Indique ton nom complet.";
      if (!data.get("birthDate")) return "Indique ta date de naissance.";
      if (!data.get("gender")) return "Choisis un genre.";
      if (String(data.get("city") ?? "").trim().length < 2) return "Indique ta ville ou commune.";
    }
    if (index === 1) {
      if (String(data.get("phone") ?? "").replace(/\D/g, "").length < 10) {
        return "Numéro WhatsApp à 10 chiffres, s'il te plaît.";
      }
    }
    if (index === 2) {
      if (!data.get("educationLevel")) return "Choisis ton niveau.";
      if (String(data.get("institution") ?? "").trim().length < 2) {
        return "Indique ton établissement.";
      }
      if (!form.querySelector<HTMLInputElement>("#consent")?.checked) {
        return "Il faut accepter d'être contacté(e) sur WhatsApp.";
      }
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);

    if (step < STEPS.length - 1) {
      const msg = validateStep(form, step);
      if (msg) {
        setError(msg);
        return;
      }
      setStep((s) => s + 1);
      return;
    }

    const msg = validateStep(form, step);
    if (msg) {
      setError(msg);
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError("Complète la vérification anti-spam avant d'envoyer.");
      return;
    }

    setPending(true);
    const formData = new FormData(form);
    if (turnstileToken) formData.set("cf-turnstile-response", turnstileToken);

    try {
      const result = await submitCoachingLead(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/accompagnement/paiement/${result.paymentReference}`);
    } catch {
      setError("Connexion interrompue. Vérifie ton réseau et réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="sticky top-16 z-10 -mx-1 bg-white/95 px-1 py-3 backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Étape {step + 1} sur {STEPS.length}
        </p>
        <div className="flex gap-2" aria-hidden>
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={cn(
                  "h-1 rounded-full",
                  i <= step ? "bg-[var(--gold)]" : "bg-slate-200",
                )}
              />
              <p
                className={cn(
                  "mt-1.5 text-[11px] font-medium",
                  i === step ? "text-[var(--primary)]" : "text-slate-400",
                )}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={step === 0 ? "space-y-4" : "hidden"}>
        <div>
          <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
            Nom complet
          </label>
          <input id="fullName" name="fullName" required autoComplete="name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="birthDate" className="text-sm font-medium text-slate-700">
            Date de naissance
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={fieldClass}
          />
          {under18 && (
            <p className="mt-1.5 text-xs text-amber-800">
              Tu as moins de 18 ans — préviens un parent avant d&apos;envoyer les 2 000 FCFA.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="gender" className="text-sm font-medium text-slate-700">
            Genre
          </label>
          <select id="gender" name="gender" required defaultValue="" className={fieldClass}>
            <option value="" disabled>
              Choisir
            </option>
            {(Object.values(Gender) as Gender[]).map((g) => (
              <option key={g} value={g}>
                {GENDER_FULL[g]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="text-sm font-medium text-slate-700">
            Ville / commune
          </label>
          <input
            id="city"
            name="city"
            required
            list="ivory-cities"
            placeholder="Cocody, Bouaké, Daloa…"
            className={fieldClass}
          />
          <datalist id="ivory-cities">
            {IVORY_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-slate-700">
            WhatsApp
          </label>
          <WhatsAppInput id="phone" name="phone" required autoComplete="tel" />
          <p id="phone-hint" className="mt-1.5 text-xs text-slate-500">
            Indicatif Côte d&apos;Ivoire +225. C&apos;est avec ce numéro qu&apos;on t&apos;ajoute au
            groupe et qu&apos;on te suit.
          </p>
        </div>
        <div>
          <label htmlFor="parentPhone" className="text-sm font-medium text-slate-700">
            WhatsApp d&apos;un parent{" "}
            <span className="font-normal text-slate-400">(optionnel)</span>
          </label>
          <WhatsAppInput id="parentPhone" name="parentPhone" autoComplete="tel" />
          <p id="parentPhone-hint" className="mt-1.5 text-xs text-slate-500">
            {under18
              ? "Fortement recommandé : à 17 ans, c'est souvent un parent qui paie les 2 000 FCFA."
              : "Si quelqu'un d'autre envoie le Wave, mets son numéro ici."}
          </p>
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email <span className="font-normal text-slate-400">(optionnel)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="pour ton compte Mibegnon, plus tard"
            className={fieldClass}
          />
        </div>
      </div>

      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="educationLevel" className="text-sm font-medium text-slate-700">
              Niveau
            </label>
            <select
              id="educationLevel"
              name="educationLevel"
              required
              defaultValue={EducationLevel.TERMINALE}
              className={fieldClass}
            >
              {(Object.values(EducationLevel) as EducationLevel[]).map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABEL[l]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="serie" className="text-sm font-medium text-slate-700">
              Série <span className="font-normal text-slate-400">(si lycée)</span>
            </label>
            <select id="serie" name="serie" defaultValue="" className={fieldClass}>
              <option value="">—</option>
              {SERIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="institution" className="text-sm font-medium text-slate-700">
            Établissement
          </label>
          <input
            id="institution"
            name="institution"
            required
            placeholder="Lycée Sainte-Marie, Université FHB…"
            className={fieldClass}
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <input id="consent" name="consent" type="checkbox" value="true" className="mt-0.5" />
          <span>
            J&apos;accepte les{" "}
            <a href="/cgu#accompagnement" className="underline" target="_blank" rel="noreferrer">
              CGU
            </a>{" "}
            et la{" "}
            <a
              href="/confidentialite#accompagnement"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              confidentialité
            </a>
            , et d&apos;être contacté(e) sur WhatsApp (toi, et le parent si tu as donné son numéro)
            pour le parcours d&apos;accompagnement. Le catalogue de bourses reste gratuit.
          </span>
        </label>
      </div>

      {step === 2 && (
        <TurnstileField onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((s) => s - 1);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex flex-[2] items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Envoi…
            </>
          ) : step < STEPS.length - 1 ? (
            <>
              Continuer <ArrowRight size={16} />
            </>
          ) : (
            "Rejoindre le parcours"
          )}
        </button>
      </div>
    </form>
  );
}
