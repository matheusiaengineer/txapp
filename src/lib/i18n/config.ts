export type Locale = "pt-BR" | "en-US" | "es-ES" | "fr-FR" | "de-DE" | "it-IT" | "ja-JP" | "zh-CN" | "hi-IN" | "ar-SA" | "ru-RU" | "pt-PT" | "nl-NL" | "ko-KR" | "tr-TR";

export const LOCALES: { code: Locale; name: string; native: string; dir: "ltr" | "rtl" }[] = [
  { code: "pt-BR", name: "Portuguese (Brazil)", native: "Português (Brasil)", dir: "ltr" },
  { code: "en-US", name: "English (US)", native: "English (US)", dir: "ltr" },
  { code: "es-ES", name: "Spanish", native: "Español", dir: "ltr" },
  { code: "fr-FR", name: "French", native: "Français", dir: "ltr" },
  { code: "de-DE", name: "German", native: "Deutsch", dir: "ltr" },
  { code: "it-IT", name: "Italian", native: "Italiano", dir: "ltr" },
  { code: "ja-JP", name: "Japanese", native: "日本語", dir: "ltr" },
  { code: "zh-CN", name: "Chinese Simplified", native: "简体中文", dir: "ltr" },
  { code: "hi-IN", name: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "ar-SA", name: "Arabic", native: "العربية", dir: "rtl" },
  { code: "ru-RU", name: "Russian", native: "Русский", dir: "ltr" },
  { code: "pt-PT", name: "Portuguese (Portugal)", native: "Português (Portugal)", dir: "ltr" },
  { code: "nl-NL", name: "Dutch", native: "Nederlands", dir: "ltr" },
  { code: "ko-KR", name: "Korean", native: "한국어", dir: "ltr" },
  { code: "tr-TR", name: "Turkish", native: "Türkçe", dir: "ltr" },
];

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "pt-BR";
  const lang = navigator.language;
  if (LOCALES.some(l => l.code === lang)) return lang as Locale;
  const base = lang.split("-")[0];
  const match = LOCALES.find(l => l.code.startsWith(base));
  return match?.code || "pt-BR";
}

export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatCurrency(n: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(n);
}

export function formatDate(date: Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}
