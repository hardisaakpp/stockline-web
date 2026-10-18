import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/features/auth/server";
import { parseCvLanguage } from "@/features/careers";
import { careersApi, CvEditor } from "@/features/careers/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("careers.cv");
  return { title: t("metaTitle") };
}

export default async function CvPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = parseCvLanguage((await searchParams).lang);
  const [{ cv, saved }, user] = await Promise.all([careersApi.cv(lang), requireUser()]);
  // Keyed by language: switching versions must remount the editor, or the other version's form state would leak in.
  return <CvEditor key={lang} initial={cv} saved={saved} userId={user.id} lang={lang} />;
}
