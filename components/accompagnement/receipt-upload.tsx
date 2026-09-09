"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadWaveReceipt } from "@/lib/actions/coaching";

export function ReceiptUpload({
  paymentReference,
  alreadySent,
}: {
  paymentReference: string;
  alreadySent: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadySent);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await uploadWaveReceipt(new FormData(e.currentTarget));
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch {
      setError("Connexion interrompue. Vérifie ton réseau et réessaie.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm text-emerald-900">
        <p className="font-semibold">Reçu bien reçu.</p>
        <p className="mt-1 text-emerald-800/80">
          On vérifie sous 24 h, puis tu reçois ton lien d&apos;espace sur WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <input type="hidden" name="paymentReference" value={paymentReference} />
      <div>
        <label htmlFor="receipt" className="text-sm font-medium text-slate-700">
          Capture d&apos;écran Wave
        </label>
        <input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        <p className="mt-1.5 text-xs text-slate-500">JPEG, PNG ou WebP · 5 Mo max.</p>
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
            <Loader2 size={16} className="animate-spin" /> Envoi…
          </>
        ) : (
          <>
            <Upload size={16} /> Envoyer le reçu
          </>
        )}
      </button>
    </form>
  );
}
