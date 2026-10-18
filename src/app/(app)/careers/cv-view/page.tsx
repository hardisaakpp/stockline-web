import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { parseCvLanguage } from "@/features/careers";
import { careersApi, CvLanguageTabs, CvViewer } from "@/features/careers/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("careers.view");
  return { title: t("metaTitle") };
}

export default async function SavedCvPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = parseCvLanguage((await searchParams).lang);
  const [t, { cv, saved }] = await Promise.all([
    getTranslations("careers.view"),
    careersApi.cv(lang),
  ]);
  if (saved) return <CvViewer key={lang} cv={cv} lang={lang} />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<CvLanguageTabs lang={lang} path="/careers/cv-view" />}
      />
      <EmptyState
        icon={FileText}
        title={lang === "en" ? t("emptyTitleEn") : t("emptyTitle")}
        description={lang === "en" ? t("emptyBodyEn") : t("emptyBody")}
        action={
          <ButtonLink href={lang === "en" ? "/careers/cv?lang=en" : "/careers/cv"}>
            {t("emptyAction")}
          </ButtonLink>
        }
      />
    </div>
  );
}
