/**
 * Normalise un numéro ivoirien vers E.164 (+225XXXXXXXXXX, 10 chiffres locaux).
 * Accepte 07…, 00225…, +225…, espaces / tirets.
 */
export function normalizeCiPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  let local: string;

  if (digits.startsWith("+225")) {
    local = digits.slice(4);
  } else if (digits.startsWith("00225")) {
    local = digits.slice(5);
  } else if (digits.startsWith("225") && digits.length >= 13) {
    local = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 10) {
    local = digits;
  } else if (digits.length === 10) {
    local = digits;
  } else {
    return null;
  }

  if (!/^\d{10}$/.test(local)) return null;
  return `+225${local}`;
}

export function isValidCiPhone(e164: string): boolean {
  return /^\+225\d{10}$/.test(e164);
}

/** Chiffres seuls pour wa.me */
export function phoneDigits(e164: string): string {
  return e164.replace(/[^\d]/g, "");
}
