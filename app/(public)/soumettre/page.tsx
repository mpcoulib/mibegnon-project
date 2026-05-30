"use client";

import { useState } from "react";
import { submitScholarship } from "./actions";
import { TurnstileField } from "@/components/turnstile-field";

export default function SoumettreePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const turnstileRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (turnstileRequired && !turnstileToken) {
      setStatus("error");
      setErrorMsg("Complète la vérification anti-spam avant d'envoyer.");
      return;
    }

    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    if (turnstileToken) {
      formData.set("cf-turnstile-response", turnstileToken);
    }

    const result = await submitScholarship(formData);

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Une erreur est survenue.");
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-green-600">Merci !</h1>
        <p className="mt-4 text-slate-500">
          Ta soumission a bien été reçue. On la vérifie et on l&apos;ajoute dès que possible.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-[var(--primary)]">Soumettre une bourse</h1>
      <p className="mt-2 text-slate-500">
        Tu connais une bourse qui n&apos;est pas encore sur Mibegnon ? Envoie-nous les infos.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de la bourse *</label>
          <input name="name" required className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Organisation / Fournisseur *</label>
          <input name="provider" required className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pays ciblé *</label>
          <input name="country" required className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lien officiel *</label>
          <input name="link" type="url" required className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea name="description" required rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date limite (si connue)</label>
          <input name="deadline" type="date" className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="flex items-center gap-2">
          <input name="isFullFunding" type="checkbox" value="true" id="isFullFunding" />
          <label htmlFor="isFullFunding" className="text-sm">
            Bourse complète (full funding)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ton email (optionnel)</label>
          <input name="submitterEmail" type="email" className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note pour l&apos;équipe (optionnel)</label>
          <textarea name="submitterNote" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <TurnstileField
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />
        </div>

        {status === "error" && <p className="text-red-500 text-sm">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === "loading" || (turnstileRequired && !turnstileToken)}
          className="w-full bg-[var(--primary)] text-white rounded-lg py-3 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "Envoi en cours..." : "Soumettre"}
        </button>
      </form>
    </div>
  );
}
