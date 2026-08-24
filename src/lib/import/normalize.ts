export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Keep a leading + (international prefix), strip everything else that isn't a digit.
  const hasLeadingPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  return hasLeadingPlus ? `+${digits}` : digits;
}
