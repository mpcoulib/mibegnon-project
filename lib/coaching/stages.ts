import { CoachingStage, EducationLevel, FileKind, Gender } from "@prisma/client";

export type StageMeta = {
  label: string;
  short: string;
  hint: string;
  /** Tailwind classes for the status pill */
  pill: string;
  /** Column shown on the kanban board */
  board: boolean;
};

export const STAGE_META: Record<CoachingStage, StageMeta> = {
  NOUVEAU: {
    label: "Nouveau",
    short: "Nouveau",
    hint: "Formulaire reçu. L'envoi Wave est automatique — cette colonne ne doit pas rester pleine.",
    pill: "bg-slate-100 text-slate-700",
    board: true,
  },
  PAIEMENT_DEMANDE: {
    label: "Paiement demandé",
    short: "Wave envoyé",
    hint: "Instructions Wave envoyées, on attend le reçu.",
    pill: "bg-amber-50 text-amber-800",
    board: true,
  },
  RECU_ENVOYE: {
    label: "Reçu à vérifier",
    short: "Reçu",
    hint: "Capture Wave uploadée, à confirmer ou refuser.",
    pill: "bg-[var(--gold)]/20 text-amber-900",
    board: true,
  },
  PAYE: {
    label: "Payé",
    short: "Payé",
    hint: "Paiement confirmé. Le lien part au clic « Confirmer et envoyer » ; cette colonne est un filet.",
    pill: "bg-emerald-50 text-emerald-800",
    board: true,
  },
  COMPTE_INVITE: {
    label: "Compte invité",
    short: "Invité",
    hint: "Lien envoyé, on attend la création du compte.",
    pill: "bg-sky-50 text-sky-800",
    board: true,
  },
  ACTIF: {
    label: "Actif",
    short: "Actif",
    hint: "Compte créé, à ajouter au groupe WhatsApp.",
    pill: "bg-[var(--primary)] text-white",
    board: true,
  },
  TERMINE: {
    label: "Terminé",
    short: "Terminé",
    hint: "Accompagnement clôturé.",
    pill: "bg-slate-200 text-slate-600",
    board: false,
  },
  REJETE: {
    label: "Rejeté",
    short: "Rejeté",
    hint: "Reçu invalide ou demande refusée.",
    pill: "bg-red-50 text-red-700",
    board: false,
  },
  INJOIGNABLE: {
    label: "Injoignable",
    short: "Injoignable",
    hint: "Aucune réponse après relances.",
    pill: "bg-slate-100 text-slate-500",
    board: false,
  },
};

/** Ordre des colonnes du kanban. */
export const BOARD_STAGES: CoachingStage[] = [
  CoachingStage.NOUVEAU,
  CoachingStage.PAIEMENT_DEMANDE,
  CoachingStage.RECU_ENVOYE,
  CoachingStage.PAYE,
  CoachingStage.COMPTE_INVITE,
  CoachingStage.ACTIF,
];

/** Étapes hors board (archives). */
export const ARCHIVE_STAGES: CoachingStage[] = [
  CoachingStage.TERMINE,
  CoachingStage.REJETE,
  CoachingStage.INJOIGNABLE,
];

export const ALL_STAGES: CoachingStage[] = [...BOARD_STAGES, ...ARCHIVE_STAGES];

export const GENDER_LABEL: Record<Gender, string> = {
  FEMININ: "F",
  MASCULIN: "M",
  NON_PRECISE: "—",
};

export const GENDER_FULL: Record<Gender, string> = {
  FEMININ: "Féminin",
  MASCULIN: "Masculin",
  NON_PRECISE: "Je ne précise pas",
};

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  RECU: "Reçu Wave",
  BULLETIN: "Bulletin",
  RELEVE: "Relevé de notes",
  LISTE_UNIVERSITES: "Liste d'universités",
  AUTRE: "Autre",
};

export const LEVEL_LABEL: Record<EducationLevel, string> = {
  TROISIEME: "3e",
  SECONDE: "2nde",
  PREMIERE: "1ère",
  TERMINALE: "Terminale",
  BAC_PLUS_1: "Bac+1",
  BAC_PLUS_2: "Bac+2",
};

// ─── Relances ────────────────────────────────────────────────────────────────

/**
 * Délai (en heures) au-delà duquel un lead est considéré « à relancer » dans une étape,
 * et qui doit agir (nous = admin, eleve = l'élève).
 * Basé sur `updatedAt` : rien ne s'est passé sur le lead depuis ce délai.
 */
type StaleRule = { hours: number; who: "nous" | "eleve" };

export const STALE_RULES: { [K in CoachingStage]?: StaleRule } = {
  NOUVEAU: { hours: 2, who: "nous" }, // auto-envoi Wave raté
  PAIEMENT_DEMANDE: { hours: 48, who: "eleve" }, // on attend le reçu
  RECU_ENVOYE: { hours: 24, who: "nous" }, // reçu à vérifier
  PAYE: { hours: 4, who: "nous" }, // lien d'activation (normalement auto à la confirmation)
  COMPTE_INVITE: { hours: 48, who: "eleve" }, // compte à créer
  ACTIF: { hours: 48, who: "nous" }, // à ajouter au groupe WhatsApp
};

export type StaleInfo = { hours: number; who: "nous" | "eleve"; overdueBy: number };

/** Retourne l'info de retard si le lead dépasse le délai de son étape, sinon null. */
export function staleInfo(
  lead: { stage: CoachingStage; updatedAt: Date },
  now = new Date(),
): StaleInfo | null {
  const rule = STALE_RULES[lead.stage];
  if (!rule) return null;
  const hours = Math.floor((now.getTime() - lead.updatedAt.getTime()) / 3_600_000);
  if (hours < rule.hours) return null;
  return { hours, who: rule.who, overdueBy: hours - rule.hours };
}

export function humanHours(hours: number): string {
  if (hours < 24) return `${hours} h`;
  const d = Math.floor(hours / 24);
  return `${d} j`;
}

export function ageFrom(birthDate: Date, now = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

/** Lien WhatsApp direct depuis un numéro E.164. */
export function waLink(phoneE164: string, text?: string): string {
  const digits = phoneE164.replace(/[^\d]/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

/** +2250701020304 → +225 07 01 02 03 04 */
export function formatPhone(phoneE164: string): string {
  const m = phoneE164.match(/^\+225(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return phoneE164;
  return `+225 ${m.slice(1).join(" ")}`;
}
