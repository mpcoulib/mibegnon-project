import { activationPageUrl, renderTemplate } from "@/lib/messaging/templates";
import { waLink } from "@/lib/coaching/stages";

export {
  activationPageUrl,
  paymentPageUrl,
  renderTemplate,
} from "@/lib/messaging/templates";

export function waveInstructionsMessage(input: {
  fullName: string;
  paymentReference: string;
  amountFcfa?: number;
}): string {
  return renderTemplate("paiement_wave", input);
}

export function activationMessage(input: { fullName: string; token: string }): string {
  return renderTemplate("paiement_confirme", {
    fullName: input.fullName,
    paymentReference: "",
    activationUrl: activationPageUrl(input.token),
  });
}

export function studentHelloMessage(fullName: string): string {
  const first = fullName.split(/\s+/)[0] ?? fullName;
  return `Bonjour, c'est ${first}. Je suis dans le parcours Mibegnon Accompagnement.`;
}

export function waToStudent(phoneE164: string, text: string): string {
  return waLink(phoneE164, text);
}
