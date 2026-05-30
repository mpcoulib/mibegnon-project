/** Preset tiers in euro cents */
export const DONATION_TIERS_CENTS = [500, 1000, 2500] as const;

export const DONATION_MIN_CENTS = 500; // 5 €
export const DONATION_MAX_CENTS = 500_000; // 5 000 €

export const DONATION_CURRENCY = "eur";

export const MONTHLY_GOAL_CENTS = Number(
  process.env.DONATION_MONTHLY_GOAL_CENTS ?? "50000"
);

export const TIER_IMPACT: Record<number, string> = {
  500: "Un café pour l'équipe — merci d'être là",
  1000: "≈ 1 mois de serveur pour garder le site en ligne",
  2500: "Données bourses fraîches pour ~100 élèves",
};

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
