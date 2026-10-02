import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/features/auth/server";
import { adminApi, UsersTable } from "@/features/admin/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.users");
  return { title: t("metaTitle") };
}

export default async function AdminUsersPage() {
  const [me, users] = await Promise.all([requireUser(), adminApi.users()]);
  return <UsersTable users={users} currentUserId={me.id} />;
}
