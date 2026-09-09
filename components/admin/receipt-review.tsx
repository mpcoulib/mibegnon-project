"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmReceiptAndInvite, reviewReceipt } from "@/lib/actions/coaching-admin";
import { CopyButton } from "@/components/accompagnement/copy-button";

type InviteResult = {
  activationUrl: string;
  waFallback: string | null;
  waLinks: { role: "student" | "parent"; url: string }[];
  summary: string;
};

export function ReceiptReviewForm({
  receiptId,
  amountFcfa,
  awaitingReview,
}: {
  receiptId: string;
  amountFcfa: number;
  awaitingReview: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [pending, start] = useTransition();

  function fields() {
    const form = formRef.current;
    if (!form) return { amountSeen: "", waveTxId: "", note: "" };
    const data = new FormData(form);
    return {
      amountSeen: String(data.get("amountSeen") ?? ""),
      waveTxId: String(data.get("waveTxId") ?? ""),
      note: String(data.get("note") ?? ""),
    };
  }

  function confirm() {
    const { amountSeen, waveTxId, note } = fields();
    setError(null);
    start(async () => {
      const res = await confirmReceiptAndInvite({
        receiptId,
        amountSeen,
        waveTxId,
        note,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setInvite({
        activationUrl: res.activationUrl,
        waFallback: res.waFallback,
        waLinks: res.waLinks,
        summary: res.summary,
      });
      router.refresh();
    });
  }

  function refuse() {
    const { amountSeen, waveTxId, note } = fields();
    setError(null);
    start(async () => {
      const res = await reviewReceipt({
        receiptId,
        decision: "REFUSE",
        amountSeen,
        waveTxId,
        note,
      });
      if (!res.success) setError(res.error);
      else router.refresh();
    });
  }

  if (invite) {
    return (
      <div className="mt-3 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm">
        <p className="font-medium text-emerald-900">{invite.summary}</p>
        <p className="break-all font-mono text-[11px] text-slate-600">{invite.activationUrl}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={invite.activationUrl} label="Copier le lien" />
          {invite.waLinks.map((link) => (
            <a
              key={link.role}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              WhatsApp · {link.role === "parent" ? "parent" : "élève"}
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (!awaitingReview) return null;

  return (
    <form ref={formRef} className="mt-3 space-y-2 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <label>
          <span className="text-xs text-slate-500">Montant vu</span>
          <input
            name="amountSeen"
            type="number"
            defaultValue={amountFcfa}
            className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5"
          />
        </label>
        <label>
          <span className="text-xs text-slate-500">ID Wave</span>
          <input name="waveTxId" className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-slate-500">Note</span>
        <input name="note" className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5" />
      </label>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={confirm}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Confirmer et envoyer le lien"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={refuse}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
    </form>
  );
}
