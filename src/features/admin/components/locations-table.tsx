"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PageHeader } from "@/components/feedback/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Location } from "../schemas";
import { LocationDialog } from "./location-dialog";

export function LocationsTable({ locations }: { locations: Location[] }) {
  const t = useTranslations("admin.locations");
  const tCommon = useTranslations("admin.common");
  // `undefined` = closed, `null` = creating, a location = editing it.
  const [dialog, setDialog] = useState<Location | null | undefined>(undefined);
  const warehouses = locations.filter((l) => l.kind === "Warehouse" && l.isActive);
  const nameOf = (code: string | null) =>
    locations.find((l) => l.code === code)?.name ?? code ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setDialog(null)}>
            <Plus className="size-4" />
            {t("new")}
          </Button>
        }
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("columns.code")}</TableHead>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.kind")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("columns.supplier")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.code}>
                <TableCell className="font-mono text-sm">{location.code}</TableCell>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>{t(`kind.${location.kind}`)}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {location.kind === "Store" ? nameOf(location.supplyingWarehouseCode) : "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm",
                      !location.isActive && "text-muted-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        location.isActive ? "bg-emerald-500" : "bg-muted-foreground/50",
                      )}
                    />
                    {location.isActive ? tCommon("active") : tCommon("inactive")}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${tCommon("edit")}: ${location.code}`}
                    onClick={() => setDialog(location)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {dialog !== undefined && (
        <LocationDialog
          key={dialog?.code ?? "new"}
          location={dialog}
          warehouses={warehouses}
          onClose={() => setDialog(undefined)}
        />
      )}
    </div>
  );
}
