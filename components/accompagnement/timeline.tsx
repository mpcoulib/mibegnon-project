import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "wave", label: "Envoie Wave", hint: "2 000 FCFA + ta référence" },
  { id: "receipt", label: "Envoie le reçu", hint: "Capture d'écran" },
  { id: "link", label: "Reçois ton lien", hint: "Vérifié à la main" },
  { id: "group", label: "Rejoins le groupe", hint: "WhatsApp de la cohorte" },
] as const;

export type TimelineStep = (typeof STEPS)[number]["id"];

export function CoachingTimeline({ current }: { current: TimelineStep }) {
  const index = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="space-y-0">
      {STEPS.map((s, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={s.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-[var(--gold)] text-[var(--primary)]",
                  active && "bg-[var(--primary)] text-white",
                  !done && !active && "border border-slate-300 text-slate-400",
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "w-px flex-1 min-h-6",
                    i < index ? "bg-[var(--gold)]" : "bg-slate-200",
                  )}
                />
              )}
            </div>
            <div className="pb-5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  active ? "text-[var(--primary)]" : "text-slate-700",
                )}
              >
                {s.label}
              </p>
              <p className="text-xs text-slate-500">{s.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
