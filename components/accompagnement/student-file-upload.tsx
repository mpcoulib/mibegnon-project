"use client";

import { useState } from "react";
import { FileKind } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { uploadStudentFile } from "@/lib/actions/coaching-activate";
import { FILE_KIND_LABEL } from "@/lib/coaching/stages";

export function StudentFileUpload() {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setPending(true);
    const form = e.currentTarget;
    const result = await uploadStudentFile(new FormData(form));
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOk(true);
    form.reset();
  }

  const field =
    "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-[var(--primary)]">Envoyer un document</p>
      <div>
        <label htmlFor="label" className="text-xs text-slate-500">
          Nom
        </label>
        <input id="label" name="label" required className={field} placeholder="Bulletin Tle T1" />
      </div>
      <div>
        <label htmlFor="kind" className="text-xs text-slate-500">
          Type
        </label>
        <select id="kind" name="kind" defaultValue="AUTRE" className={field}>
          {(Object.values(FileKind) as FileKind[])
            .filter((k) => k !== "RECU")
            .map((k) => (
              <option key={k} value={k}>
                {FILE_KIND_LABEL[k]}
              </option>
            ))}
        </select>
      </div>
      <input
        name="file"
        type="file"
        required
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="block w-full text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {ok && <p className="text-xs text-emerald-700">Document envoyé.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : "Envoyer"}
      </button>
    </form>
  );
}
