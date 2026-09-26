const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Converts latin digits in a string to Persian digits. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

/** Formats a numeric price (stored as a number) for display, e.g. ۲۴٬۵۰۰٬۰۰۰ تومان */
export function formatToman(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `${toPersianDigits(n.toLocaleString("en-US"))} تومان`;
}

export function formatNumber(value: number | string | null | undefined): string {
  return toPersianDigits(Number(value ?? 0).toLocaleString("en-US"));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

/** Normalizes an Iranian mobile number to the 09xxxxxxxxx form (mirrors the DB function). */
export function normalizePhone(input: string): string {
  const latin = input.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
  let digits = latin.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("98")) digits = `0${digits.slice(2)}`;
  if (digits.length === 13 && digits.startsWith("0098")) digits = `0${digits.slice(4)}`;
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return digits;
}

export function isValidIranianMobile(input: string): boolean {
  const p = normalizePhone(input);
  return /^09\d{9}$/.test(p);
}
