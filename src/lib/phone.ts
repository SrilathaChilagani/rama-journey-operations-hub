// Phone numbers are stored in E.164 (+919876543210). Indian numbers may be typed without the
// country code; anything else must start with + and its country code.
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  let e164: string;
  if (trimmed.startsWith("+")) e164 = `+${digits}`;
  else if (trimmed.startsWith("00")) e164 = `+${digits.slice(2)}`;
  else if (digits.length === 10 && /^[6-9]/.test(digits)) e164 = `+91${digits}`; // Indian mobile
  else if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) e164 = `+91${digits.slice(1)}`;
  else return null;
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
}
