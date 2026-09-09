"use client";

import { useState, useTransition } from "react";
import {
  addCuratedItem,
  removeCuratedItem,
  searchCatalog,
} from "@/lib/actions/coaching-admin";

type Hit = { id: string; name: string; country: string };

export function CuratedEditor({
  leadId,
  items,
}: {
  leadId: string;
  items: {
    id: string;
    comment: string | null;
    university: { id: string; name: string } | null;
    scholarship: { id: string; name: string } | null;
  }[];
}) {
  const [q, setQ] = useState("");
  const [unis, setUnis] = useState<Hit[]>([]);
  const [bos, setBos] = useState<Hit[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function search() {
    start(async () => {
      const res = await searchCatalog(q);
      setUnis(res.universities);
      setBos(res.scholarships);
    });
  }

  function add(kind: "universityId" | "scholarshipId", id: string) {
    const fd = new FormData();
    fd.set("leadId", leadId);
    fd.set(kind, id);
    fd.set("comment", comment);
    fd.set("priority", String(items.length));
    setError(null);
    start(async () => {
      const res = await addCuratedItem(fd);
      if (!res.success) setError(res.error);
      else {
        setComment("");
        setUnis([]);
        setBos([]);
        setQ("");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Liste curated
      </h2>
      <ul className="mt-3 space-y-2">
        {items.length === 0 && <p className="text-xs text-slate-400">Rien assigné.</p>}
        {items.map((it) => (
          <li key={it.id} className="flex items-start justify-between gap-2 text-sm">
            <div>
              <p className="font-medium text-slate-800">
                {it.university?.name ?? it.scholarship?.name}
              </p>
              {it.comment && <p className="text-xs text-slate-500">{it.comment}</p>}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => { await removeCuratedItem(it.id, leadId); })}
              className="text-xs text-red-600 hover:underline"
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Chercher une université ou bourse"
            className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={search}
            disabled={pending}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          >
            Chercher
          </button>
        </div>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Commentaire pour l'élève (optionnel)"
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {(unis.length > 0 || bos.length > 0) && (
          <div className="max-h-48 space-y-1 overflow-y-auto text-xs">
            {unis.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => add("universityId", u.id)}
                className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-slate-50"
              >
                Uni · {u.name} <span className="text-slate-400">{u.country}</span>
              </button>
            ))}
            {bos.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => add("scholarshipId", s.id)}
                className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-slate-50"
              >
                Bourse · {s.name} <span className="text-slate-400">{s.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
