import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/feedback/page-header";
import { adminApi, RolesMatrixTable } from "@/features/admin/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.roles");
  return { title: t("metaTitle") };
}

export default async function AdminRolesPage() {
  const [t, matrix] = await Promise.all([getTranslations("admin.roles"), adminApi.roles()]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <RolesMatrixTable matrix={matrix} />
    </div>
  );
}
