import type { ApplicationStatus } from "@prisma/client";

// Status color scheme — mirrors OfferBloom tracker style (bg / text / dot triple).
// Ordered to reflect the candidature funnel.
export interface StatusConfig {
  id: ApplicationStatus;
  label: string;
  bg: string;
  text: string;
  dot: string;
}

export const APPLICATION_STATUSES: StatusConfig[] = [
  { id: "INTERESSE", label: "Intéressé", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  { id: "EN_PREPARATION", label: "En préparation", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  { id: "POSTULE", label: "Postulé", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  { id: "EN_ATTENTE", label: "En attente", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  { id: "ACCEPTE", label: "Accepté", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  { id: "REFUSE", label: "Refusé", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
];

const FALLBACK: StatusConfig = {
  id: "INTERESSE",
  label: "Intéressé",
  bg: "bg-slate-50",
  text: "text-slate-600",
  dot: "bg-slate-400",
};

export function getStatusConfig(status: ApplicationStatus): StatusConfig {
  return APPLICATION_STATUSES.find((s) => s.id === status) ?? FALLBACK;
}
