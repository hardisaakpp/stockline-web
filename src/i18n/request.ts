import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  matchAcceptLanguage,
  type AppLocale,
} from "./config";

/** Cookie first (explicit choice), then the browser's preference, then the default. */
async function resolveLocale(): Promise<AppLocale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return matchAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return { locale, messages: (await import(`../messages/${locale}`)).default };
});
