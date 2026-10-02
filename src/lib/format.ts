import type { AppLocale } from "@/i18n/config";
import { APP_CURRENCY, DATE_LOCALES, NUMBER_LOCALE } from "./locale";

export type Formatters = {
  /** Calendar date from the API (`yyyy-MM-dd`), e.g. "Oct 01, 2026". */
  date: (value: string | null | undefined) => string;
  /** Short calendar date for axes and compact labels, e.g. "Oct 01". */
  shortDate: (value: string) => string;
  /** Instant (ISO 8601 with offset) in the viewer's time zone. */
  dateTime: (value: string | null | undefined) => string;
  /** Quantity with up to two decimals and thousands separators. */
  quantity: (value: number | null | undefined) => string;
  currency: (value: number | null | undefined) => string;
  /** Ratio (0.25) as a percentage ("25%"). */
  percent: (value: number | null | undefined) => string;
};

const EMPTY = "—";

/** Parses an API calendar date as UTC so it never shifts a day with the viewer's time zone. */
const parseCalendarDate = (value: string) => new Date(`${value}T00:00:00Z`);

const numberFormats = {
  quantity: new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 2 }),
  currency: new Intl.NumberFormat(NUMBER_LOCALE, { style: "currency", currency: APP_CURRENCY }),
  percent: new Intl.NumberFormat(NUMBER_LOCALE, { style: "percent", maximumFractionDigits: 1 }),
};

const cache = new Map<AppLocale, Formatters>();

/** Formatters for a language. Cheap to call: instances are cached per locale. */
export function getFormatters(locale: AppLocale): Formatters {
  const cached = cache.get(locale);
  if (cached) return cached;

  const dateLocale = DATE_LOCALES[locale];
  const day = new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
  const short = new Intl.DateTimeFormat(dateLocale, {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
  const instant = new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const orEmpty = <T>(value: T | null | undefined, format: (v: T) => string) =>
    value === null || value === undefined ? EMPTY : format(value);

  const formatters: Formatters = {
    date: (value) => (value ? day.format(parseCalendarDate(value)) : EMPTY),
    shortDate: (value) => short.format(parseCalendarDate(value)),
    dateTime: (value) => (value ? instant.format(new Date(value)) : EMPTY),
    quantity: (value) => orEmpty(value, numberFormats.quantity.format),
    currency: (value) => orEmpty(value, numberFormats.currency.format),
    percent: (value) => orEmpty(value, numberFormats.percent.format),
  };
  cache.set(locale, formatters);
  return formatters;
}
