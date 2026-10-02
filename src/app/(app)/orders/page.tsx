import type { Metadata } from "next";
import { FileSpreadsheet, SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { can, PERMISSIONS } from "@/features/auth";
import { requirePermission } from "@/features/auth/server";
import {
  OrdersFilters,
  OrdersTable,
  PaginationBar,
  parseListParams,
  toApiQuery,
  hasActiveFilters,
  ORDER_STATUSES,
  PRODUCTION_VISIBLE_STATUSES,
} from "@/features/orders";
import { ordersApi } from "@/features/orders/server";
import { ButtonLink } from "@/components/ui/button-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders.list");
  return { title: t("metaTitle") };
}

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const [user, t, raw] = await Promise.all([
    requirePermission(PERMISSIONS.ordersView),
    getTranslations("orders.list"),
    searchParams,
  ]);
  const params = parseListParams(raw);
  const result = await ordersApi.list(toApiQuery(params, user.id));
  const canImport = can(user, PERMISSIONS.ordersImport);
  const isBuyer = user.role === "Buyer";
  const filtered = hasActiveFilters(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canImport && (
            <ButtonLink href="/orders/import">
              <FileSpreadsheet className="size-4" />
              {t("newOrder")}
            </ButtonLink>
          )
        }
      />

      <OrdersFilters
        params={params}
        statuses={user.role === "SupplierProduction" ? PRODUCTION_VISIBLE_STATUSES : ORDER_STATUSES}
        showMine={isBuyer}
      />

      {result.items.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchX}
            title={t("noResultsTitle")}
            description={t("noResultsDescription")}
          />
        ) : (
          <EmptyState
            icon={FileSpreadsheet}
            title={t("noOrdersTitle")}
            description={t("noOrdersDescription")}
            action={canImport && <ButtonLink href="/orders/import">{t("newOrder")}</ButtonLink>}
          />
        )
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t("results", { count: result.totalCount })}
          </p>
          <OrdersTable orders={result.items} params={params} />
          <PaginationBar
            params={params}
            page={result.page}
            totalPages={result.totalPages}
            basePath="/orders"
          />
        </>
      )}
    </div>
  );
}
