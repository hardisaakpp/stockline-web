import { useLocale } from "next-intl";
import { getLocale } from "next-intl/server";
import { getFormatters, type Formatters } from "@/lib/format";
import type { AppLocale } from "./config";

/** Formatters for the current language in a Client Component. */
export function useFormatters(): Formatters {
  return getFormatters(useLocale() as AppLocale);
}

/** Formatters for the current language in a Server Component. */
export async function getServerFormatters(): Promise<Formatters> {
  return getFormatters((await getLocale()) as AppLocale);
}
