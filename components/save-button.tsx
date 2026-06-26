"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleBookmark } from "@/lib/actions/bookmarks";
import { useSavedScholarshipIds } from "@/components/saved-scholarship-context";

export function SaveButton({
  scholarshipId,
  initialSaved = false,
}: {
  scholarshipId: string;
  initialSaved?: boolean;
}) {
  const savedCtx = useSavedScholarshipIds();
  const [localSaved, setLocalSaved] = useState<boolean | null>(null);
  const [isPending, start] = useTransition();

  const saved =
    localSaved !== null
      ? localSaved
      : savedCtx?.isLoaded
        ? savedCtx.isSaved(scholarshipId)
        : initialSaved;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const next = !saved;
    setLocalSaved(next);
    savedCtx?.setSaved(scholarshipId, next);
    start(async () => {
      try {
        await toggleBookmark(scholarshipId);
      } catch {
        setLocalSaved(!next);
        savedCtx?.setSaved(scholarshipId, !next);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`shrink-0 p-2 rounded-lg border transition-all ${
        saved
          ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
          : "border-slate-200 bg-white text-slate-400 hover:text-red-400 hover:border-red-200"
      }`}
      aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
    >
      <Heart size={15} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
    </button>
  );
}
