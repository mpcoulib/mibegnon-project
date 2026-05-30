import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/donate/stripe";

/** Returns true if this event was already handled (idempotent skip). */
export async function claimEvent(
  stripeEventId: string,
  type: string
): Promise<boolean> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: { stripeEventId, type },
    });
    return false;
  } catch {
    return true;
  }
}

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  const donationId = session.metadata?.donationId;
  if (!donationId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  await prisma.donation.updateMany({
    where: {
      id: donationId,
      status: { in: ["PENDING", "FAILED"] },
    },
    data: {
      status: "SUCCEEDED",
      succeededAt: new Date(),
      stripePaymentIntentId: paymentIntentId ?? undefined,
      stripeSubscriptionId: subscriptionId ?? undefined,
      stripeCustomerId: customerId ?? undefined,
    },
  });
}

export async function markDonationCanceled(sessionId: string): Promise<void> {
  await prisma.donation.updateMany({
    where: {
      stripeCheckoutSessionId: sessionId,
      status: "PENDING",
    },
    data: { status: "CANCELED" },
  });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" || session.status === "complete") {
        await fulfillCheckoutSession(session);
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.id) await markDonationCanceled(session.id);
      break;
    }
    default:
      break;
  }
}

export async function verifyAndProcessWebhook(
  rawBody: string,
  signature: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, status: 500, message: "Webhook not configured" };
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return { ok: false, status: 400, message: "Invalid signature" };
  }

  if (await claimEvent(event.id, event.type)) {
    return { ok: true };
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error("[stripe/webhook]", event.type, err);
    await prisma.stripeWebhookEvent
      .delete({ where: { stripeEventId: event.id } })
      .catch(() => {});
    return { ok: false, status: 500, message: "Processing failed" };
  }

  return { ok: true };
}
