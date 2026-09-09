"use client";

import { useState, useTransition } from "react";
import { createActivationLink, updateLeadCohort } from "@/lib/actions/coaching-admin";
import { CopyButton } from "@/components/accompagnement/copy-button";
import { activationMessage, waToStudent, waveInstructionsMessage } from "@/lib/coaching/templates";

export function LeadOps({
  leadId,
  fullName,
  phone,
  paymentReference,
  amountFcfa,
  cohort,
  canInvite,
}: {
  leadId: string;
  fullName: string;
  phone: string;
  paymentReference: string;
  amountFcfa: number;
  cohort: string | null;
  canInvite: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const waveText = waveInstructionsMessage({ fullName, paymentReference, amountFcfa });

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Actions</h2>

      <div className="flex flex-wrap gap-2">
        <a
          href={waToStudent(phone, waveText)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
        >
          WhatsApp · Wave
        </a>
        <CopyButton value={waveText} label="Copier le message Wave" />
        <CopyButton value={phone} label="Copier le numéro" />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const cohortValue = String(new FormData(e.currentTarget).get("cohort") ?? "");
          start(async () => {
            await updateLeadCohort(leadId, cohortValue);
          });
        }}
      >
        <input
          name="cohort"
          defaultValue={cohort ?? ""}
          placeholder="Cohorte (ex. Rentrée 2026)"
          className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium"
        >
          Sauver
        </button>
      </form>

      {canInvite && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              start(async () => {
                const res = await createActivationLink(leadId);
                if (!res.success) setError(res.error);
                else if (res.activationUrl) setUrl(res.activationUrl);
              });
            }}
            className="w-full rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Générer un nouveau lien
          </button>
          {url && (
            <div className="space-y-2">
              <p className="break-all font-mono text-[11px] text-slate-600">{url}</p>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={url} label="Copier le lien" />
                <a
                  href={waToStudent(phone, activationMessage({ fullName, token: url.split("/").pop() ?? "" }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800"
                >
                  WhatsApp · lien
                </a>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
