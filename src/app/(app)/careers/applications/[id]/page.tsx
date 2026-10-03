import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ApplicationDetailView, careersApi } from "@/features/careers/server";
import { ApiError } from "@/lib/api/problem";

async function load(id: string) {
  try {
    return await careersApi.application(id);
  } catch (error) {
    // Someone else's application and one that does not exist answer the same.
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/careers/applications/[id]">): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getTranslations("careers.applications")]);
  try {
    return { title: `${(await careersApi.application(id)).offer.title} · ${t("metaTitle")}` };
  } catch (error) {
    if (error instanceof ApiError) return {};
    throw error;
  }
}

export default async function ApplicationPage({ params }: PageProps<"/careers/applications/[id]">) {
  const { id } = await params;
  return <ApplicationDetailView detail={await load(id)} />;
}
