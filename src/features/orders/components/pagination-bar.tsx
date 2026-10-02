import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toSearchParams, type OrderListParams } from "../list-params";
import { ButtonLink } from "@/components/ui/button-link";

/** Previous/next links that keep every other filter. Plain links: they work without JavaScript. */
export function PaginationBar({
  params,
  page,
  totalPages,
  basePath,
}: {
  params: OrderListParams;
  page: number;
  totalPages: number;
  basePath: string;
}) {
  const t = useTranslations("orders.list.pagination");
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const query = toSearchParams({ ...params, page: target }).toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav aria-label={t("label")} className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">{t("pageOf", { page, total: totalPages })}</p>
      <div className="flex gap-2">
        {page > 1 ? (
          <ButtonLink variant="outline" href={hrefFor(page - 1)} rel="prev">
            <ChevronLeft className="size-4" />
            {t("previous")}
          </ButtonLink>
        ) : (
          <Button variant="outline" disabled>
            <ChevronLeft className="size-4" />
            {t("previous")}
          </Button>
        )}
        {page < totalPages ? (
          <ButtonLink variant="outline" href={hrefFor(page + 1)} rel="next">
            {t("next")}
            <ChevronRight className="size-4" />
          </ButtonLink>
        ) : (
          <Button variant="outline" disabled>
            {t("next")}
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </nav>
  );
}
