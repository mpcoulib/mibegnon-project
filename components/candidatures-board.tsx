"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  ExternalLink,
} from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  APPLICATION_STATUSES,
  getStatusConfig,
} from "@/lib/application-status";
import type { ApplicationWithRelations } from "@/lib/actions/applications";
import {
  updateApplicationStatus,
  deleteApplication,
  toggleDocument,
  deleteDocument,
  addDocument,
} from "@/lib/actions/applications";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function appTitle(app: ApplicationWithRelations) {
  return app.scholarship?.name ?? app.university?.name ?? "Candidature";
}

function appProvider(app: ApplicationWithRelations) {
  return app.scholarship?.provider ?? (app.university ? "Université" : "—");
}

function appCountry(app: ApplicationWithRelations) {
  return app.scholarship?.country ?? app.university?.country ?? "—";
}

function appLink(app: ApplicationWithRelations) {
  if (app.scholarship) return `/bourses/${app.scholarship.id}`;
  if (app.university) return `/universites/${app.university.id}`;
  return null;
}

export function CandidaturesBoard({
  applications,
}: {
  applications: ApplicationWithRelations[];
}) {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const countFor = (id: ApplicationStatus | "all") =>
    id === "all"
      ? applications.length
      : applications.filter((a) => a.status === id).length;

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  return (
    <div>
      {/* Status filter pills */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1 text-xs transition-all",
            filter === "all"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          )}
        >
          Tous ({countFor("all")})
        </button>

        {APPLICATION_STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-xs transition-all",
              filter === s.id
                ? cn(s.bg, s.text, "font-medium")
                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            )}
          >
            <span
              className={cn(
                "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                s.dot
              )}
            />
            {s.label} ({countFor(s.id)})
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Bourse
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Fournisseur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Pays
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Documents
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Échéance
                </th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const status = getStatusConfig(app.status);
                const docsDone = app.documents.filter(
                  (d) => d.isCompleted
                ).length;
                const link = appLink(app);
                const isOpen = expandedId === app.id;

                return (
                  <BoardRow
                    key={app.id}
                    app={app}
                    status={status}
                    docsDone={docsDone}
                    link={link}
                    isOpen={isOpen}
                    onToggleExpand={() =>
                      setExpandedId(isOpen ? null : app.id)
                    }
                    openStatusId={openStatusId}
                    setOpenStatusId={setOpenStatusId}
                    startTransition={startTransition}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BoardRow({
  app,
  status,
  docsDone,
  link,
  isOpen,
  onToggleExpand,
  openStatusId,
  setOpenStatusId,
  startTransition,
}: {
  app: ApplicationWithRelations;
  status: ReturnType<typeof getStatusConfig>;
  docsDone: number;
  link: string | null;
  isOpen: boolean;
  onToggleExpand: () => void;
  openStatusId: string | null;
  setOpenStatusId: (id: string | null) => void;
  startTransition: (cb: () => void) => void;
}) {
  const [newDoc, setNewDoc] = useState("");

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        {/* Title — expandable */}
        <td className="px-4 py-3">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-left text-sm font-medium text-slate-800 hover:text-[var(--primary)] cursor-pointer"
          >
            {isOpen ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronRight size={14} className="text-slate-400" />
            )}
            {appTitle(app)}
          </button>
        </td>

        {/* Provider */}
        <td className="px-4 py-3">
          <span className="text-sm text-slate-600">{appProvider(app)}</span>
        </td>

        {/* Country */}
        <td className="px-4 py-3">
          <span className="text-xs text-slate-400">{appCountry(app)}</span>
        </td>

        {/* Status dropdown */}
        <td className="relative px-4 py-3">
          <button
            onClick={() =>
              setOpenStatusId(openStatusId === app.id ? null : app.id)
            }
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-xs",
              status.bg,
              status.text
            )}
          >
            <span
              className={cn(
                "mr-1 inline-block h-1.5 w-1.5 rounded-full",
                status.dot
              )}
            />
            {status.label}
          </button>
          {openStatusId === app.id && (
            <div className="absolute z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {APPLICATION_STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setOpenStatusId(null);
                    startTransition(() =>
                      updateApplicationStatus(app.id, s.id)
                    );
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50",
                    app.status === s.id && "font-medium"
                  )}
                >
                  <span
                    className={cn("h-2 w-2 rounded-full", s.dot)}
                  />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </td>

        {/* Documents count */}
        <td className="px-4 py-3">
          <button
            onClick={onToggleExpand}
            className="cursor-pointer text-xs text-slate-500 hover:text-[var(--primary)]"
          >
            {app.documents.length === 0
              ? "Aucun"
              : `${docsDone}/${app.documents.length} prêts`}
          </button>
        </td>

        {/* Deadline */}
        <td className="px-4 py-3">
          <span className="text-xs text-slate-500">
            {formatDate(app.deadline)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-2 py-3">
          <div className="flex items-center gap-1">
            {link && (
              <Link
                href={link}
                className="text-slate-300 hover:text-[var(--primary)]"
                title="Voir"
              >
                <ExternalLink size={14} />
              </Link>
            )}
            <button
              onClick={() =>
                startTransition(() => deleteApplication(app.id))
              }
              className="cursor-pointer text-slate-300 hover:text-red-400"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded — document checklist */}
      {isOpen && (
        <tr className="border-b border-slate-100 bg-slate-50/50">
          <td colSpan={7} className="px-8 py-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-slate-400">
                Documents à préparer
              </p>

              {app.documents.length === 0 && (
                <p className="text-sm text-slate-400">
                  Aucun document. Ajoute ta liste de pièces à fournir.
                </p>
              )}

              {app.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <button
                    onClick={() =>
                      startTransition(() => toggleDocument(doc.id))
                    }
                    className={cn(
                      "flex h-4 w-4 cursor-pointer items-center justify-center rounded border",
                      doc.isCompleted
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {doc.isCompleted && <Check size={11} />}
                  </button>
                  <span
                    className={cn(
                      doc.isCompleted
                        ? "text-slate-400 line-through"
                        : "text-slate-700"
                    )}
                  >
                    {doc.name}
                  </span>
                  <button
                    onClick={() =>
                      startTransition(() => deleteDocument(doc.id))
                    }
                    className="cursor-pointer text-slate-300 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {/* Add document */}
              <form
                action={(formData) => {
                  const name = String(formData.get("name") ?? "");
                  if (!name.trim()) return;
                  setNewDoc("");
                  startTransition(() => addDocument(app.id, name));
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  name="name"
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  placeholder="Ex: Relevé de notes, lettre de motivation…"
                  className="w-72 rounded-lg border border-slate-200 px-3 py-1.5 text-sm placeholder-slate-300"
                />
                <button
                  type="submit"
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs text-white hover:bg-[var(--primary)]/90"
                >
                  <Plus size={12} /> Ajouter
                </button>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
