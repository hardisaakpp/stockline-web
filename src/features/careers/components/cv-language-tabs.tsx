"use client";

import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { CV_LANGUAGES, type CvLanguage } from "../schemas";

/** Switches between the versions of the CV (Spanish, the original, and English). Each is its own saved document. */
export function CvLanguageTabs({ lang, path }: { lang: CvLanguage; path: string }) {
  const t = useTranslations("careers.cv.language");
  return (
    <nav aria-label={t("label")} className="flex gap-1">
      {CV_LANGUAGES.map((code) => (
        <ButtonLink
          key={code}
          href={code === "es" ? path : `${path}?lang=${code}`}
          variant={code === lang ? "default" : "outline"}
          size="sm"
          aria-current={code === lang ? "page" : undefined}
        >
          {t(code)}
        </ButtonLink>
      ))}
    </nav>
  );
}
