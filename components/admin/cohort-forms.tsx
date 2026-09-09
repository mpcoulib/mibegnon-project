"use client";

import { useState, useTransition } from "react";
import { CoachingStage } from "@prisma/client";
import { Pencil, Check, X } from "lucide-react";
import {
  assignUnassignedToCohort,
  moveStageToCohort,
  renameCohort,
  type OpsResult,
} from "@/lib/actions/coaching-ops";
import { BOARD_STAGES, STAGE_META } from "@/lib/coaching/stages";

function useOps() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function run(action: (fd: FormData) => Promise<OpsResult>, fd: FormData, okText: (n?: number) => string) {
    setMsg(null);
    start(async () => {
      const res = await action(fd);
      if (res.success) setMsg({ ok: true, text: okText(res.count) });
      else setMsg({ ok: false, text: res.error });
    });
  }

  return { pending, msg, run };
}

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p className={`mt-2 text-xs ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>
  );
}

const inputCls =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30";
const btnCls =
  "rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--primary)]/90 disabled:opacity-50";

export function RenameCohortInline({ cohort }: { cohort: string }) {
  const [editing, setEditing] = useState(false);
  const { pending, msg, run } = useOps();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[var(--primary)]"
      >
        <Pencil size={12} /> Renommer
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        run(renameCohort, fd, (n) => `Renommée (${n ?? 0} élève${(n ?? 0) > 1 ? "s" : ""}).`);
        setEditing(false);
      }}
    >
      <input type="hidden" name="from" value={cohort} />
      <input name="to" defaultValue={cohort} required maxLength={60} className={inputCls} autoFocus />
      <button type="submit" disabled={pending} className={btnCls} title="Valider">
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded-lg border border-slate-200 px-2 py-1.5 text-slate-500 hover:bg-slate-50"
        title="Annuler"
      >
        <X size={14} />
      </button>
      <Feedback msg={msg} />
    </form>
  );
}

export function AssignUnassignedForm({
  cohorts,
  defaultCohort,
  count,
}: {
  cohorts: string[];
  defaultCohort: string;
  count: number;
}) {
  const { pending, msg, run } = useOps();

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          assignUnassignedToCohort,
          new FormData(e.currentTarget),
          (n) => `${n ?? 0} élève${(n ?? 0) > 1 ? "s" : ""} assigné${(n ?? 0) > 1 ? "s" : ""}.`,
        );
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Cohorte
        <input
          name="cohort"
          list="cohort-names"
          defaultValue={defaultCohort}
          required
          maxLength={60}
          className={inputCls}
        />
      </label>
      <datalist id="cohort-names">
        {cohorts.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <button type="submit" disabled={pending || count === 0} className={btnCls}>
        Assigner les {count} sans cohorte
      </button>
      <Feedback msg={msg} />
    </form>
  );
}

export function MoveStageForm({ cohorts }: { cohorts: string[] }) {
  const { pending, msg, run } = useOps();

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          moveStageToCohort,
          new FormData(e.currentTarget),
          (n) => `${n ?? 0} élève${(n ?? 0) > 1 ? "s" : ""} déplacé${(n ?? 0) > 1 ? "s" : ""}.`,
        );
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Étape
        <select name="stage" defaultValue={CoachingStage.ACTIF} className={inputCls}>
          {BOARD_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_META[s].label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Depuis la cohorte
        <select name="fromCohort" defaultValue="" className={inputCls}>
          <option value="">Toutes (y compris sans cohorte)</option>
          {cohorts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Vers la cohorte
        <input name="cohort" list="cohort-names" required maxLength={60} className={inputCls} />
      </label>
      <button type="submit" disabled={pending} className={btnCls}>
        Déplacer
      </button>
      <Feedback msg={msg} />
    </form>
  );
}
