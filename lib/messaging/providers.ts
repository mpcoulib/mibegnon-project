export type ProviderResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

function twilioAuth(): { sid: string; token: string } | null {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) return null;
  return { sid, token };
}

export function isWhatsAppConfigured(): boolean {
  return !!(twilioAuth() && process.env.TWILIO_WHATSAPP_FROM?.trim());
}

/** API WhatsApp Twilio (sandbox / Business). Off par défaut : on envoie à la main via wa.me. */
export function isWhatsAppApiEnabled(): boolean {
  return (
    isWhatsAppConfigured() &&
    process.env.TWILIO_WHATSAPP_API?.trim().toLowerCase() === "true"
  );
}

export function isSmsConfigured(): boolean {
  return !!(twilioAuth() && process.env.TWILIO_SMS_FROM?.trim());
}

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

async function twilioMessage(from: string, to: string, body: string): Promise<ProviderResult> {
  const creds = twilioAuth();
  if (!creds) return { ok: false, error: "Twilio non configuré." };

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${creds.sid}:${creds.token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    },
  );
  const data = (await res.json()) as { sid?: string; message?: string; error_message?: string };
  if (!res.ok || !data.sid) {
    return {
      ok: false,
      error: data.error_message || data.message || `Twilio HTTP ${res.status}`,
    };
  }
  return { ok: true, providerId: data.sid };
}

export async function sendWhatsApp(toE164: string, body: string): Promise<ProviderResult> {
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
  if (!from) return { ok: false, error: "TWILIO_WHATSAPP_FROM manquant." };
  const to = toE164.startsWith("whatsapp:") ? toE164 : `whatsapp:${toE164}`;
  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  return twilioMessage(fromAddr, to, body);
}

export async function sendSms(toE164: string, body: string): Promise<ProviderResult> {
  const from = process.env.TWILIO_SMS_FROM?.trim();
  if (!from) return { ok: false, error: "TWILIO_SMS_FROM manquant." };
  return twilioMessage(from, toE164, body);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<ProviderResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!key || !from) return { ok: false, error: "Resend non configuré." };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });
  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok || !data.id) {
    return { ok: false, error: data.message || `Resend HTTP ${res.status}` };
  }
  return { ok: true, providerId: data.id };
}
