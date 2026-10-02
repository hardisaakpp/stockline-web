import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/feedback/page-header";
import { PERMISSIONS } from "@/features/auth";
import { requirePermission } from "@/features/auth/server";
import { ImportWizard } from "@/features/orders";
import { ButtonLink } from "@/components/ui/button-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders.import");
  return { title: t("metaTitle") };
}

export default async function ImportOrderPage() {
  const [, t] = await Promise.all([
    requirePermission(PERMISSIONS.ordersImport),
    getTranslations("orders.import"),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ButtonLink variant="ghost" size="sm" className="-ml-2" href="/orders">
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </ButtonLink>
      <PageHeader title={t("title")} description={t("description")} />
      <ImportWizard />
    </div>
  );
}
