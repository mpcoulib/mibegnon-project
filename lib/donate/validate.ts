import {
  DONATION_MAX_CENTS,
  DONATION_MIN_CENTS,
  DONATION_TIERS_CENTS,
} from "@/lib/donate/constants";

export type DonateKindInput = "one_time" | "monthly";

export interface DonateInput {
  amountCents: number;
  kind: DonateKindInput;
  donorName?: string;
  donorEmail?: string;
  publicMessage?: string;
  isAnonymous: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAmountCents(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return parseInt(raw, 10);
  return null;
}

export function validateDonateInput(body: unknown): DonateInput | string {
  if (!body || typeof body !== "object") return "Données invalides.";

  const o = body as Record<string, unknown>;
  const amountCents = parseAmountCents(o.amountCents);
  if (amountCents === null) return "Montant invalide.";
  if (amountCents < DONATION_MIN_CENTS) {
    return `Le montant minimum est de ${DONATION_MIN_CENTS / 100} €.`;
  }
  if (amountCents > DONATION_MAX_CENTS) {
    return `Le montant maximum est de ${DONATION_MAX_CENTS / 100} €.`;
  }

  const kind = o.kind;
  if (kind !== "one_time" && kind !== "monthly") {
    return "Type de don invalide.";
  }

  const isAnonymous = o.isAnonymous === true;

  let donorName =
    typeof o.donorName === "string" ? o.donorName.trim().slice(0, 80) : "";
  const donorEmail =
    typeof o.donorEmail === "string" ? o.donorEmail.trim().slice(0, 254) : "";
  let publicMessage =
    typeof o.publicMessage === "string"
      ? o.publicMessage.trim().slice(0, 280)
      : "";

  if (isAnonymous) {
    donorName = "";
    publicMessage = "";
  }

  if (donorEmail && !EMAIL_RE.test(donorEmail)) {
    return "Adresse email invalide.";
  }

  return {
    amountCents,
    kind,
    donorName: donorName || undefined,
    donorEmail: donorEmail || undefined,
    publicMessage: publicMessage || undefined,
    isAnonymous,
  };
}

export function isPresetTier(cents: number): boolean {
  return (DONATION_TIERS_CENTS as readonly number[]).includes(cents);
}

export function buildDisplayName(
  donorName: string | undefined,
  isAnonymous: boolean
): string {
  if (isAnonymous) return "Un ami de Mibegnon";
  if (!donorName) return "Un soutien";
  const first = donorName.split(/\s+/)[0];
  return first || "Un soutien";
}
