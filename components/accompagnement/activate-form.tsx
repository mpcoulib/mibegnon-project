"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { activateCoachingAccount } from "@/lib/actions/coaching-activate";

export function ActivateForm({
  token,
  fullName,
  email,
}: {
  token: string;
  fullName: string;
  email: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const emailLocked = Boolean(email);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await activateCoachingAccount(new FormData(e.currentTarget));
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/accompagnement");
  }

  const field =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="fullName" value={fullName} />

      <div>
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={email ?? ""}
          readOnly={emailLocked}
          className={field}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          C&apos;est ton identifiant Mibegnon. Tu pourras aussi l&apos;utiliser pour le catalogue
          gratuit.
        </p>
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={field}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="text-sm font-medium text-slate-700">
          Confirme le mot de passe
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={field}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Création…
          </>
        ) : (
          "Ouvrir mon espace"
        )}
      </button>
    </form>
  );
}
