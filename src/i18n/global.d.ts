import type en from "../messages/en";
import type { AppLocale } from "./config";

// Makes `t("some.key")` type-checked against the English catalog.
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof en;
  }
}
