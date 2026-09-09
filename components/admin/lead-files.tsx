"use client";

import { useState, useTransition } from "react";
import { FileKind } from "@prisma/client";
import { uploadAdminFile } from "@/lib/actions/coaching-admin";
import { FILE_KIND_LABEL } from "@/lib/coaching/stages";

export function LeadFiles({
  leadId,
  files,
}: {
  leadId: string;
  files: {
    id: string;
    label: string;
    kind: FileKind;
    uploadedBy: "ADMIN" | "STUDENT";
    url: string | null;
    createdAt: Date;
  }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Fichiers</h2>
      <ul className="mt-3 space-y-2">
        {files.length === 0 && <p className="text-xs text-slate-400">Aucun fichier.</p>}
        {files.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">
              {f.label}{" "}
              <span className="text-[11px] text-slate-400">
                {FILE_KIND_LABEL[f.kind]} · {f.uploadedBy === "ADMIN" ? "équipe" : "élève"}
              </span>
            </span>
            {f.url && (
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-medium text-[var(--primary)] hover:underline"
              >
                Ouvrir
              </a>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-4 space-y-2 border-t border-slate-100 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setError(null);
          start(async () => {
            const res = await uploadAdminFile(new FormData(form));
            if (!res.success) setError(res.error);
            else form.reset();
          });
        }}
      >
        <input type="hidden" name="leadId" value={leadId} />
        <input
          name="label"
          required
          placeholder="Libellé"
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        />
        <select name="kind" defaultValue="AUTRE" className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
          {(Object.values(FileKind) as FileKind[]).map((k) => (
            <option key={k} value={k}>
              {FILE_KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <input
          name="file"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-xs"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Envoyer à l&apos;élève
        </button>
      </form>
    </section>
  );
}
