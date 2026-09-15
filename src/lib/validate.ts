// Shared validation for customer contact details — used by verification AND checkout.

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

// Common typo domains people actually type — catch them with a helpful message.
const TYPO_FIXES: Record<string, string> = {
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co.nz": "gmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.co": "outlook.com",
  "yahoo.co": "yahoo.com",
  "yaho.com": "yahoo.com",
  "icloud.co": "icloud.com",
};

export type EmailCheck = { ok: true; email: string } | { ok: false; error: string };
export type PhoneCheck = { ok: true; phone: string } | { ok: false; error: string };

export function validateEmail(raw: unknown): EmailCheck {
  const email = String(raw ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Email is required." };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "That email doesn't look right — e.g. name@gmail.com." };
  }
  const domain = email.split("@")[1];
  const fix = TYPO_FIXES[domain];
  if (fix) {
    return { ok: false, error: `Did you mean "${fix}"? "${domain}" looks like a typo.` };
  }
  return { ok: true, email };
}

export function validatePhone(raw: unknown): PhoneCheck {
  const phone = String(raw ?? "").trim();
  if (!phone) return { ok: false, error: "Phone number is required." };
  const cleaned = phone.replace(/[\s\-()]/g, "");
  // NZ cafe — accept NZ mobiles (021…) and landlines (09…) or +64 format
  if (!/^(?:\+64|0)\d{8,10}$/.test(cleaned)) {
    return { ok: false, error: "Enter a NZ phone number — e.g. 021 234 5678 or 09 299 2916." };
  }
  return { ok: true, phone: cleaned };
}
