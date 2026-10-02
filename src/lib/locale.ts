import type { AppLocale } from "@/i18n/config";

/**
 * Single source of truth for how dates and numbers are rendered. Output must never depend on the
 * visitor's browser locale, so the rest of the app formats through `@/lib/format` only.
 *
 * Dates follow the interface language. Numbers and money always use one convention
 * (1,234.56 — comma thousands, dot decimals, USD) so figures read the same in both languages.
 */
export const DATE_LOCALES: Record<AppLocale, string> = { en: "en-US", es: "es-EC" };
export const NUMBER_LOCALE = "en-US";
export const APP_CURRENCY = "USD";
