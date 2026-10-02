"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { hasActiveFilters, toSearchParams, type OrderListParams } from "../list-params";
import type { OrderStatus } from "../schemas";

const SEARCH_DEBOUNCE_MS = 350;

type Props = {
  params: OrderListParams;
  statuses: readonly OrderStatus[];
  /** "Created by me" only makes sense for the role that imports orders. */
  showMine: boolean;
};

/** Filters live in the URL, so a filtered list can be bookmarked, shared and survives a reload. */
export function OrdersFilters({ params, statuses, showMine }: Props) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("orders.status");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.q ?? "");

  const apply = (patch: Partial<OrderListParams>) => {
    const query = toSearchParams({ ...params, ...patch, page: 1 }).toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
  };

  // Debounced: search as the user types without a request per keystroke.
  useEffect(() => {
    if (search.trim() === (params.q ?? "")) return;
    const timer = setTimeout(() => apply({ q: search.trim() || undefined }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `apply` is recreated every render; only the text should retrigger this.
  }, [search]);

  const clear = () => {
    setSearch("");
    startTransition(() => router.replace(pathname));
  };

  return (
    <search aria-busy={pending} className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-60 flex-1">
        <Label htmlFor="orders-search" className="sr-only">
          {t("list.searchLabel")}
        </Label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="orders-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("list.searchPlaceholder")}
          className="h-9 pl-8"
        />
      </div>

      <div className="w-52 space-y-1">
        <Label htmlFor="orders-status" className="text-xs text-muted-foreground">
          {t("list.statusLabel")}
        </Label>
        <NativeSelect
          id="orders-status"
          value={params.status ?? ""}
          onChange={(event) =>
            apply({ status: (event.target.value || undefined) as OrderStatus | undefined })
          }
          className="h-9"
        >
          <option value="">{t("list.allStatuses")}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {tStatus(status)}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1">
        <Label htmlFor="orders-from" className="text-xs text-muted-foreground">
          {t("list.dateFrom")}
        </Label>
        <Input
          id="orders-from"
          type="date"
          value={params.from ?? ""}
          max={params.to}
          onChange={(e) => apply({ from: e.target.value || undefined })}
          className="h-9 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="orders-to" className="text-xs text-muted-foreground">
          {t("list.dateTo")}
        </Label>
        <Input
          id="orders-to"
          type="date"
          value={params.to ?? ""}
          min={params.from}
          onChange={(e) => apply({ to: e.target.value || undefined })}
          className="h-9 w-40"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={params.pending ? "default" : "outline"}
          size="lg"
          aria-pressed={params.pending}
          onClick={() => apply({ pending: !params.pending })}
        >
          {t("list.pending")}
        </Button>
        {showMine && (
          <Button
            variant={params.mine ? "default" : "outline"}
            size="lg"
            aria-pressed={params.mine}
            onClick={() => apply({ mine: !params.mine })}
          >
            {t("list.mine")}
          </Button>
        )}
        {hasActiveFilters(params) && (
          <Button variant="ghost" size="lg" onClick={clear}>
            <X className="size-4" />
            {t("list.clearFilters")}
          </Button>
        )}
      </div>
    </search>
  );
}
