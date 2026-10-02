import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PERMISSIONS } from "@/features/auth";
import { requirePermission } from "@/features/auth/server";
import { getOrder, OrderDetail } from "@/features/orders/server";
import { ApiError } from "@/lib/api/problem";

export async function generateMetadata({ params }: PageProps<"/orders/[id]">): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getTranslations("orders.detail")]);
  try {
    return { title: t("metaTitle", { code: (await getOrder(id)).header.code }) };
  } catch (error) {
    if (error instanceof ApiError) return {};
    throw error;
  }
}

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  await requirePermission(PERMISSIONS.ordersView);
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  return <OrderDetail id={id} tab={tab} />;
}
