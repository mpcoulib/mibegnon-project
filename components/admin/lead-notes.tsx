"use client";

import { useState, useTransition } from "react";
import { addCoachingNote } from "@/lib/actions/coaching-admin";

export function LeadNotes({
  leadId,
  notes,
}: {
  leadId: string;
  notes: { id: string; body: string; visibility: "PRIVEE" | "PARTAGEE"; createdAt: Date }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h2>
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setError(null);
          start(async () => {
            const res = await addCoachingNote(new FormData(form));
            if (!res.success) setError(res.error);
            else form.reset();
          });
        }}
      >
        <input type="hidden" name="leadId" value={leadId} />
        <textarea
          name="body"
          rows={3}
          placeholder="Conseil ou mémo…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-slate-600">
            <input type="checkbox" name="visibility" value="PARTAGEE" className="mr-1" />
            Visible par l&apos;élève
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
      <ul className="mt-4 space-y-3">
        {notes.length === 0 && <p className="text-xs text-slate-400">Aucune note.</p>}
        {notes.map((n) => (
          <li key={n.id} className="border-l-2 border-[var(--gold)]/50 pl-3 text-sm">
            <p className="whitespace-pre-wrap text-slate-700">{n.body}</p>
            <p className="mt-1 text-[11px] text-slate-400">
              {n.visibility === "PARTAGEE" ? "Partagée" : "Privée"} ·{" "}
              {new Date(n.createdAt).toLocaleString("fr-FR")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
