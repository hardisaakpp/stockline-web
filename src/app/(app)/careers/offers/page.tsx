import { Briefcase } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { careersApi, OffersView } from "@/features/careers/server";
import { ApiError } from "@/lib/api/problem";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("careers.offers");
  return { title: t("metaTitle") };
}

async function load() {
  try {
    const [list, preferences] = await Promise.all([careersApi.offers(), careersApi.preferences()]);
    return { list, preferences };
  } catch (error) {
    // Offers are ranked against the CV: without a saved one the page explains what to do first.
    if (error instanceof ApiError && error.extensions.code === "cv-missing") return null;
    throw error;
  }
}

export default async function OffersPage() {
  const [t, data] = await Promise.all([getTranslations("careers.offers"), load()]);
  if (data) return <OffersView list={data.list} preferences={data.preferences} />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <EmptyState
        icon={Briefcase}
        title={t("needCvTitle")}
        description={t("needCvBody")}
        action={<ButtonLink href="/careers/cv">{t("goToCv")}</ButtonLink>}
      />
    </div>
  );
}
