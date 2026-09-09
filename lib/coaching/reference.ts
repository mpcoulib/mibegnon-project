import { createHash, randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I

export function generatePaymentReference(): string {
  const bytes = randomBytes(6);
  let body = "";
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  return `MBG-${body}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateActivationToken(): string {
  return randomBytes(24).toString("base64url");
}
