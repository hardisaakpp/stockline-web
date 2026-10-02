export const LOCALES = ["en", "es"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "sl_locale";

/** Name of each language in that language, for the switcher. */
export const LOCALE_NAMES: Record<AppLocale, string> = { en: "English", es: "Español" };

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Picks the best supported language from an `Accept-Language` header. */
export function matchAcceptLanguage(header: string | null | undefined): AppLocale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1);
      return { language: tag.trim().toLowerCase().split("-")[0], q: Number.isNaN(q) ? 0 : q };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);
  return ranked.map((entry) => entry.language).find(isLocale) ?? null;
}
