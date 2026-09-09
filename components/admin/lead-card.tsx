"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CoachingStage } from "@prisma/client";
import { MessageCircle, MapPin, GraduationCap, Receipt, Paperclip, Mail, Clock } from "lucide-react";
import { moveLeadStage } from "@/lib/actions/coaching-admin";
import type { BoardLead } from "@/lib/data/coaching";
import {
  ALL_STAGES,
  GENDER_LABEL,
  LEVEL_LABEL,
  STAGE_META,
  ageFrom,
  formatPhone,
  humanHours,
  staleInfo,
  waLink,
} from "@/lib/coaching/stages";

function relative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hier" : `il y a ${d} j`;
}

export function LeadCard({ lead }: { lead: BoardLead }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onMove(to: CoachingStage) {
    setError(null);
    startTransition(async () => {
      const res = await moveLeadStage(lead.id, to);
      if (!res.success) setError(res.error);
    });
  }

  const age = ageFrom(new Date(lead.birthDate));
  const stale = staleInfo({ stage: lead.stage, updatedAt: new Date(lead.updatedAt) });

  return (
    <article
      className={`rounded-xl border bg-white p-3 shadow-sm transition-opacity ${
        stale ? (stale.who === "nous" ? "border-red-200" : "border-amber-200") : "border-slate-200"
      } ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/accompagnement/${lead.id}`}
          className="font-semibold text-sm text-[var(--primary)] hover:underline leading-tight"
        >
          {lead.fullName}
        </Link>
        <span className="shrink-0 rounded-md bg-[var(--gold)]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-900">
          {lead.paymentReference}
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {GENDER_LABEL[lead.gender]} · {age} ans · {relative(new Date(lead.createdAt))}
        {lead.cohort && <> · <span className="text-slate-400">{lead.cohort}</span></>}
      </p>

      {stale && (
        <p
          className={`mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
            stale.who === "nous" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
          }`}
          title={`Sans mouvement depuis ${humanHours(stale.hours)}`}
        >
          <Clock size={11} />
          {stale.who === "nous" ? "À traiter" : "À relancer"} · {humanHours(stale.hours)}
        </p>
      )}

      <ul className="mt-2 space-y-1 text-xs text-slate-600">
        <li className="flex items-center gap-1.5">
          <GraduationCap size={12} className="shrink-0 text-slate-400" />
          <span className="truncate">
            {LEVEL_LABEL[lead.educationLevel]}
            {lead.serie ? ` ${lead.serie}` : ""} · {lead.institution}
          </span>
        </li>
        <li className="flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0 text-slate-400" />
          <span className="truncate">{lead.city}</span>
        </li>
        {lead.email && (
          <li className="flex items-center gap-1.5">
            <Mail size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{lead.email}</span>
          </li>
        )}
        {lead.parentPhone && (
          <li>
            <a
              href={waLink(lead.parentPhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-800 hover:underline"
              title="WhatsApp parent"
            >
              <MessageCircle size={12} />
              Parent {formatPhone(lead.parentPhone)}
            </a>
          </li>
        )}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2">
        <a
          href={waLink(lead.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
          title="Ouvrir dans WhatsApp"
        >
          <MessageCircle size={12} />
          {formatPhone(lead.phone)}
        </a>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {lead._count.receipts > 0 && (
            <span className="inline-flex items-center gap-0.5" title="Reçus">
              <Receipt size={11} /> {lead._count.receipts}
            </span>
          )}
          {lead._count.messages > 0 && (
            <span className="inline-flex items-center gap-0.5" title="Messages">
              <MessageCircle size={11} /> {lead._count.messages}
            </span>
          )}
          {lead._count.files > 0 && (
            <span className="inline-flex items-center gap-0.5" title="Fichiers">
              <Paperclip size={11} /> {lead._count.files}
            </span>
          )}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="sr-only">Changer d&apos;étape</span>
        <select
          value={lead.stage}
          disabled={pending}
          onChange={(e) => onMove(e.target.value as CoachingStage)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        >
          {ALL_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_META[s].label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </article>
  );
}
