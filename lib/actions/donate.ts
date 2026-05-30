"use server";

import { DonationKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DONATION_CURRENCY } from "@/lib/donate/constants";
import { getSiteUrl, getStripe } from "@/lib/donate/stripe";
import {
  buildDisplayName,
  validateDonateInput,
  type DonateInput,
} from "@/lib/donate/validate";

export type CreateCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createDonationCheckout(
  input: DonateInput
): Promise<CreateCheckoutResult> {
  const validated = validateDonateInput(input);
  if (typeof validated === "string") {
    return { ok: false, error: validated };
  }

  const displayName = buildDisplayName(
    validated.donorName,
    validated.isAnonymous
  );

  const donation = await prisma.donation.create({
    data: {
      amountCents: validated.amountCents,
      currency: DONATION_CURRENCY,
      kind:
        validated.kind === "monthly"
          ? DonationKind.MONTHLY
          : DonationKind.ONE_TIME,
      donorName: validated.donorName,
      donorEmail: validated.donorEmail,
      publicMessage: validated.publicMessage,
      isAnonymous: validated.isAnonymous,
      displayName,
    },
  });

  const siteUrl = getSiteUrl();
  const stripe = getStripe();
  const amountLabel = `${validated.amountCents / 100} €`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: validated.kind === "monthly" ? "subscription" : "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DONATION_CURRENCY,
            unit_amount: validated.amountCents,
            product_data: {
              name:
                validated.kind === "monthly"
                  ? `Soutien mensuel Mibegnon — ${amountLabel}`
                  : `Soutien Mibegnon — ${amountLabel}`,
              description:
                "Aide à garder Mibegnon gratuit pour les élèves ivoiriens",
            },
            ...(validated.kind === "monthly"
              ? { recurring: { interval: "month" as const } }
              : {}),
          },
        },
      ],
      success_url: `${siteUrl}/soutenir/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/soutenir/annule`,
      customer_email: validated.donorEmail || undefined,
      metadata: {
        donationId: donation.id,
      },
      ...(validated.kind === "monthly"
        ? {
            subscription_data: {
              metadata: { donationId: donation.id },
            },
          }
        : {
            payment_intent_data: {
              metadata: { donationId: donation.id },
            },
          }),
    });

    if (!session.url) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "FAILED" },
      });
      return { ok: false, error: "Impossible de créer la session de paiement." };
    }

    await prisma.donation.update({
      where: { id: donation.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[donate/checkout]", err);
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "FAILED" },
    });
    return {
      ok: false,
      error: "Le paiement est temporairement indisponible. Réessaie plus tard.",
    };
  }
}
