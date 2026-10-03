import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ApplicationsList, careersApi } from "@/features/careers/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("careers.applications");
  return { title: t("metaTitle") };
}

export default async function ApplicationsPage() {
  return <ApplicationsList items={await careersApi.applications()} />;
}
