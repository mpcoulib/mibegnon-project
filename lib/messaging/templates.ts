import {
  COACHING_AMOUNT_FCFA,
  COACHING_WAVE_NAME,
  COACHING_WAVE_NUMBER,
  formatFcfa,
  getSiteUrl,
} from "@/lib/coaching/constants";

export const TEMPLATE_IDS = [
  "paiement_wave",
  "recu_recu",
  "paiement_confirme",
  "liste_prete",
  "relance",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATE_META: Record<
  TemplateId,
  { label: string; hint: string; needsCustom: boolean; needsToken: boolean }
> = {
  paiement_wave: {
    label: "Instructions Wave",
    hint: "Montant, numéro, référence, lien du reçu.",
    needsCustom: false,
    needsToken: false,
  },
  recu_recu: {
    label: "Reçu bien reçu",
    hint: "Accusé, vérification sous 24 h.",
    needsCustom: false,
    needsToken: false,
  },
  paiement_confirme: {
    label: "Paiement confirmé — crée ton espace",
    hint: "Lien d'activation + groupe WhatsApp.",
    needsCustom: false,
    needsToken: true,
  },
  liste_prete: {
    label: "Ta liste est prête",
    hint: "Renvoyer vers Mon accompagnement.",
    needsCustom: false,
    needsToken: false,
  },
  relance: {
    label: "Relance (texte libre)",
    hint: "Tu tapes le message, il est toujours journalisé.",
    needsCustom: true,
    needsToken: false,
  },
};

export type TemplateVars = {
  fullName: string;
  paymentReference: string;
  amountFcfa?: number;
  activationUrl?: string | null;
  customBody?: string;
};

function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0] ?? fullName;
}

export function paymentPageUrl(ref: string): string {
  return `${getSiteUrl()}/accompagnement/paiement/${encodeURIComponent(ref)}`;
}

export function activationPageUrl(token: string): string {
  return `${getSiteUrl()}/accompagnement/activer/${encodeURIComponent(token)}`;
}

export function renderTemplate(id: TemplateId, vars: TemplateVars): string {
  const first = firstName(vars.fullName);
  const amount = formatFcfa(vars.amountFcfa ?? COACHING_AMOUNT_FCFA);
  const wave = COACHING_WAVE_NUMBER || "(numéro à confirmer)";

  switch (id) {
    case "paiement_wave":
      return [
        `Akwaba ${first} !`,
        ``,
        `Pour rejoindre Mibegnon Accompagnement, envoie ${amount} via Wave.`,
        ``,
        `Numéro : ${wave}`,
        `Nom : ${COACHING_WAVE_NAME}`,
        `Dans le message Wave, mets exactement : ${vars.paymentReference}`,
        ``,
        `Ensuite envoie ta capture ici :`,
        paymentPageUrl(vars.paymentReference),
        ``,
        `On vérifie à la main, puis tu reçois ton lien.`,
      ].join("\n");
    case "recu_recu":
      return [
        `Merci ${first}, on a bien reçu ton reçu Wave (${vars.paymentReference}).`,
        ``,
        `Vérification à la main sous 24 h. On t'écrit dès que c'est confirmé.`,
      ].join("\n");
    case "paiement_confirme":
      return [
        `Akwaba ${first}, paiement confirmé !`,
        ``,
        `Crée ton espace Mibegnon ici (lien valable 7 jours) :`,
        vars.activationUrl ?? "(lien à générer)",
        ``,
        `Ensuite on t'ajoute au groupe WhatsApp.`,
      ].join("\n");
    case "liste_prete":
      return [
        `${first}, ta liste d'universités est en ligne.`,
        ``,
        `Ouvre Mon accompagnement : ${getSiteUrl()}/dashboard/accompagnement`,
        ``,
        `Lis les commentaires, et écris-nous si tu bloques.`,
      ].join("\n");
    case "relance":
      return (vars.customBody ?? "").trim();
  }
}

export function emailSubject(id: TemplateId, vars: TemplateVars): string {
  switch (id) {
    case "paiement_wave":
      return `Mibegnon — Wave ${vars.paymentReference}`;
    case "recu_recu":
      return "Mibegnon — reçu bien reçu";
    case "paiement_confirme":
      return "Mibegnon — crée ton espace";
    case "liste_prete":
      return "Mibegnon — ta liste est prête";
    case "relance":
      return "Mibegnon — accompagnement";
  }
}

/** Préfixe si le message part au parent. */
export function forParent(body: string, studentName: string): string {
  return `Pour le parent de ${studentName} —\n\n${body}`;
}
