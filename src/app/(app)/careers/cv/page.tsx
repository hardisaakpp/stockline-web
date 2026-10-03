import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { careersApi, CvEditor } from "@/features/careers/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("careers.cv");
  return { title: t("metaTitle") };
}

export default async function CvPage() {
  const { cv, saved } = await careersApi.cv();
  return <CvEditor initial={cv} saved={saved} />;
}
