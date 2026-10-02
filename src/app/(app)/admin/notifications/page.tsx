import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/feedback/page-header";
import { adminApi, NotificationsPanel } from "@/features/admin/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.notifications");
  return { title: t("metaTitle") };
}

export default async function AdminNotificationsPage() {
  const [t, topics, subscriptions, users] = await Promise.all([
    getTranslations("admin.notifications"),
    adminApi.topics(),
    adminApi.subscriptions(),
    adminApi.users(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <NotificationsPanel
        topics={topics}
        subscriptions={subscriptions}
        users={users.map((u) => ({ email: u.email, displayName: u.displayName }))}
      />
    </div>
  );
}
