/** Tarif d'entrée du parcours guidé (FCFA). */
export const COACHING_AMOUNT_FCFA = Number(
  process.env.COACHING_AMOUNT_FCFA ?? "2000",
);

/** Numéro Wave du marchand (E.164 ou local CI). */
export const COACHING_WAVE_NUMBER =
  process.env.COACHING_WAVE_NUMBER?.trim() || "";

export const COACHING_WAVE_NAME =
  process.env.COACHING_WAVE_NAME?.trim() || "Mibegnon";

/** WhatsApp de l'équipe (bouton « Discute avec nous »). */
export const COACHING_WHATSAPP_NUMBER =
  process.env.COACHING_WHATSAPP_NUMBER?.trim() || COACHING_WAVE_NUMBER;

export const COACHING_DEFAULT_COHORT =
  process.env.COACHING_DEFAULT_COHORT?.trim() || "Rentrée 2026";

export const COACHING_STORAGE_BUCKET =
  process.env.COACHING_STORAGE_BUCKET?.trim() || "coaching";

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const RECEIPT_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const FILE_MAX_BYTES = 8 * 1024 * 1024;
export const FILE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const ACTIVATION_TTL_DAYS = 7;

export const IVORY_CITIES = [
  "Abobo",
  "Adjamé",
  "Anyama",
  "Attécoubé",
  "Bingerville",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Songon",
  "Treichville",
  "Yopougon",
  "Abengourou",
  "Bondoukou",
  "Bouaké",
  "Daloa",
  "Divo",
  "Gagnoa",
  "Korhogo",
  "Man",
  "Odienné",
  "San-Pédro",
  "Soubré",
  "Yamoussoukro",
] as const;

/** Séries du lycée ivoirien (optionnel, pour la curation). */
export const SERIES = [
  "A1",
  "A2",
  "B",
  "C",
  "D",
  "E",
  "F1",
  "F2",
  "F3",
  "F4",
  "G1",
  "G2",
  "H",
  "BT",
  "Autre",
] as const;

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}
