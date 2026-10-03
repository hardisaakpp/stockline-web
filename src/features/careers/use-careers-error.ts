"use client";

import { useTranslations } from "next-intl";
import type { ActionError } from "@/lib/actions/result";
import { useErrorMessage } from "@/lib/actions/use-error-message";

/** The API's own code (e.g. `cv-missing`) gets a specific message; anything else falls back to the generic ones. */
export function useCareersError() {
  const t = useTranslations("careers");
  const generic = useErrorMessage();
  return (error: ActionError): string => {
    const key = `errors.${error.apiCode}` as "errors.cv-missing";
    return error.apiCode && t.has(key) ? t(key) : generic(error);
  };
}

/** Field problems from a validation error, one readable line each. */
export function useFieldProblems() {
  const t = useTranslations("careers");
  const fieldLabels: Record<string, string> = {
    fullName: t("cv.fields.fullName"),
    headline: t("cv.fields.headline"),
    summary: t("cv.fields.summary"),
    "contact.email": t("cv.fields.email"),
    "contact.phone": t("cv.fields.phone"),
    "contact.location": t("cv.fields.location"),
    "contact.links": t("cv.items.link"),
  };
  const word = (code: string): string => {
    const items = /^max-(\d+)-items$/.exec(code);
    if (items) return t("validation.tooMany", { max: Number(items[1]) });
    const length = /^max-(\d+)$/.exec(code);
    if (length) return t("validation.tooLong", { max: Number(length[1]) });
    if (code === "required" || code === "invalid-email" || code === "invalid-url")
      return t(`validation.${code}`);
    return t("validation.other");
  };
  return (errors: Record<string, string[]>): string[] =>
    Object.entries(errors).map(
      ([field, codes]) =>
        `${fieldLabels[field] ?? field}: ${[...new Set(codes.map(word))].join(", ")}`,
    );
}
