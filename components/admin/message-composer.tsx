"use client";

import { useMemo, useState, useTransition } from "react";
import { sendLeadMessage } from "@/lib/actions/coaching-messages";
import {
  TEMPLATE_IDS,
  TEMPLATE_META,
  renderTemplate,
  type TemplateId,
} from "@/lib/messaging/templates";

const STATUS_LABEL: Record<string, string> = {
  sent: "envoyé",
  failed: "échec",
  logged: "à envoyer",
};

export function MessageComposer({
  leadId,
  fullName,
  paymentReference,
  amountFcfa,
  hasParent,
  smsConfigured,
  messages,
}: {
  leadId: string;
  fullName: string;
  paymentReference: string;
  amountFcfa: number;
  hasParent: boolean;
  smsConfigured: boolean;
  messages: {
    id: string;
    channel: string;
    templateId: string | null;
    status: string;
    toRole: string | null;
    error: string | null;
    createdAt: Date;
  }[];
}) {
  const [templateId, setTemplateId] = useState<TemplateId>("paiement_wave");
  const [customBody, setCustomBody] = useState("");
  const [toStudent, setToStudent] = useState(true);
  const [toParent, setToParent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [waLinks, setWaLinks] = useState<{ role: "student" | "parent"; url: string }[]>([]);
  const [pending, start] = useTransition();

  const meta = TEMPLATE_META[templateId];
  const preview = useMemo(
    () =>
      renderTemplate(templateId, {
        fullName,
        paymentReference,
        amountFcfa,
        customBody,
        activationUrl: "https://mibegnon.com/accompagnement/activer/…",
      }),
    [templateId, fullName, paymentReference, amountFcfa, customBody],
  );

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Messages</h2>
      <p className="text-[11px] text-slate-500">
        {smsConfigured
          ? "Le SMS part tout de suite. WhatsApp est optionnel : tu l’ouvres sur ton téléphone si tu veux aussi les pinguer là."
          : "SMS non configuré. Le message s’ouvre dans WhatsApp sur ton téléphone."}
      </p>

      <label className="block text-xs text-slate-500">
        Modèle
        <select
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value as TemplateId);
            setError(null);
            setSummary(null);
            setWaLinks([]);
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800"
        >
          {TEMPLATE_IDS.map((id) => (
            <option key={id} value={id}>
              {TEMPLATE_META[id].label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[11px] text-slate-400">{meta.hint}</p>

      {meta.needsCustom && (
        <textarea
          value={customBody}
          onChange={(e) => setCustomBody(e.target.value)}
          rows={4}
          placeholder="Texte de la relance…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      )}

      {!meta.needsCustom && (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          {preview}
        </pre>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-slate-700">
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={toStudent} onChange={(e) => setToStudent(e.target.checked)} />
          Élève
        </label>
        <label className={`inline-flex items-center gap-1.5 ${hasParent ? "" : "text-slate-400"}`}>
          <input
            type="checkbox"
            checked={toParent}
            disabled={!hasParent}
            onChange={(e) => setToParent(e.target.checked)}
          />
          Parent
        </label>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          setSummary(null);
          setWaLinks([]);
          start(async () => {
            const res = await sendLeadMessage({
              leadId,
              templateId,
              customBody,
              toStudent,
              toParent,
            });
            if (!res.success) setError(res.error);
            else {
              setSummary(res.summary);
              setWaLinks(res.waLinks);
            }
          });
        }}
        className="w-full rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Envoi…" : smsConfigured ? "Envoyer le SMS" : "Préparer WhatsApp"}
      </button>

      {summary && <p className="text-xs text-emerald-800">{summary}</p>}
      {waLinks.length > 0 && (
        <div className="flex flex-col gap-1">
          {waLinks.map((link) => (
            <a
              key={link.role}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-xs font-medium text-emerald-800 hover:underline"
            >
              Aussi envoyer sur WhatsApp
              {link.role === "parent" ? " (parent)" : ""}
            </a>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <ul className="max-h-48 space-y-2 overflow-y-auto border-t border-slate-100 pt-3">
        {messages.length === 0 && <li className="text-xs text-slate-400">Aucun message encore.</li>}
        {messages.map((m) => (
          <li key={m.id} className="text-[11px] text-slate-600">
            <span className="font-medium uppercase">{m.channel}</span>
            {m.templateId ? ` · ${m.templateId}` : ""}
            {m.toRole === "parent" ? " · parent" : ""}
            {" · "}
            <span
              className={
                m.status === "sent"
                  ? "text-emerald-700"
                  : m.status === "failed"
                    ? "text-red-600"
                    : "text-amber-800"
              }
            >
              {STATUS_LABEL[m.status] ?? m.status}
            </span>
            <span className="text-slate-400">
              {" · "}
              {new Date(m.createdAt).toLocaleString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {m.error && <p className="text-slate-400">{m.error}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
