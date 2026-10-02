import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { adminApi, LocationsTable } from "@/features/admin/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.locations");
  return { title: t("metaTitle") };
}

export default async function AdminLocationsPage() {
  return <LocationsTable locations={await adminApi.locations()} />;
}
