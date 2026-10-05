import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { careersApi, CvViewer } from "@/features/careers/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("careers.view");
  return { title: t("metaTitle") };
}

export default async function SavedCvPage() {
  const [t, { cv, saved }] = await Promise.all([getTranslations("careers.view"), careersApi.cv()]);
  if (saved) return <CvViewer cv={cv} />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <EmptyState
        icon={FileText}
        title={t("emptyTitle")}
        description={t("emptyBody")}
        action={<ButtonLink href="/careers/cv">{t("emptyAction")}</ButtonLink>}
      />
    </div>
  );
}
