"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/feedback/page-header";
import type { CvLanguage } from "../schemas";
import { CvLanguageTabs } from "./cv-language-tabs";

/** The editor's title, worded for the version being edited, with the switch between versions. */
export function CvEditorHeader({ lang }: { lang: CvLanguage }) {
  const t = useTranslations("careers.cv");
  return (
    <PageHeader
      title={lang === "en" ? t("english.title") : t("title")}
      description={lang === "en" ? t("english.description") : t("description")}
      actions={<CvLanguageTabs lang={lang} path="/careers/cv" />}
    />
  );
}
