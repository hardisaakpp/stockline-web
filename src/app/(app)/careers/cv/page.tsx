import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/features/auth/server";
import { careersApi, CvEditor } from "@/features/careers/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("careers.cv");
  return { title: t("metaTitle") };
}

export default async function CvPage() {
  const [{ cv, saved }, user] = await Promise.all([careersApi.cv(), requireUser()]);
  return <CvEditor initial={cv} saved={saved} userId={user.id} />;
}
