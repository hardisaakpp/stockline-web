import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PERMISSIONS } from "@/features/auth";
import { requirePermission } from "@/features/auth/server";
import { DashboardView } from "@/features/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("metaTitle") };
}

export default async function DashboardPage() {
  const user = await requirePermission(PERMISSIONS.dashboardView);
  return <DashboardView firstName={user.displayName.split(" ")[0] ?? user.displayName} />;
}
