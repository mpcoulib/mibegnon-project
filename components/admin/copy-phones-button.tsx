"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copie une liste de numéros WhatsApp (E.164) dans le presse-papiers, un par ligne.
 * Sert à ajouter une promotion entière à un groupe WhatsApp depuis le téléphone.
 */
export function CopyPhonesButton({
  phones,
  label = "Copier les numéros",
  className = "",
}: {
  phones: string[];
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  const unique = Array.from(new Set(phones));

  async function copy() {
    try {
      await navigator.clipboard.writeText(unique.join("\n"));
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // Clipboard indisponible (http, permissions) : on affiche la liste en prompt.
      window.prompt("Copie ces numéros :", unique.join(", "));
    }
  }

  if (unique.length === 0) return null;

  return (
    <button
      type="button"
      onClick={copy}
      title={`${unique.length} numéro${unique.length > 1 ? "s" : ""}`}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-200/70 hover:text-[var(--primary)] transition-colors ${className}`}
    >
      {done ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
      {done ? "Copié" : `${label} (${unique.length})`}
    </button>
  );
}
