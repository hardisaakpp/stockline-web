"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { SelectField, SwitchField } from "@/components/ui/form-controls";
import { useErrorMessage } from "@/lib/actions/use-error-message";
import { createLocation, updateLocation } from "../actions.server";
import { locationDefaults, locationFormSchema, type LocationFormValues } from "../forms";
import type { Location } from "../schemas";

type Props = { location: Location | null; warehouses: readonly Location[]; onClose: () => void };
type ValidationKey = "codeRequired" | "nameRequired";

/** Creates a location, or edits one (its code and type are fixed once created). */
export function LocationDialog({ location, warehouses, onClose }: Props) {
  const t = useTranslations("admin.locations");
  const tCommon = useTranslations("admin.common");
  const describe = useErrorMessage();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editing = location !== null;
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: locationDefaults(location, warehouses),
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const { errors } = form.formState;
  const message = (key?: string) => (key ? t(`validation.${key as ValidationKey}`) : undefined);

  const submit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(null);
      const result = editing
        ? await updateLocation(location.code, values)
        : await createLocation(values);
      if (!result.ok)
        return setError(
          !editing && result.error.code === "conflict"
            ? t("errors.exists")
            : describe(result.error),
        );
      toast.success(editing ? t("toasts.updated") : t("toasts.created"));
      onClose();
    }),
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("form.editTitle") : t("form.createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <FormField
            id="code"
            label={t("form.code")}
            hint={editing ? t("form.codeHint") : undefined}
            disabled={editing}
            error={message(errors.code?.message)}
            {...form.register("code")}
          />
          <FormField
            id="name"
            label={t("form.name")}
            error={message(errors.name?.message)}
            {...form.register("name")}
          />
          <SelectField
            id="kind"
            label={t("form.kind")}
            disabled={editing}
            {...form.register("kind")}
          >
            <option value="Warehouse">{t("kind.Warehouse")}</option>
            <option value="Store">{t("kind.Store")}</option>
          </SelectField>
          {kind === "Store" && (
            <SelectField
              id="supplier"
              label={t("form.supplier")}
              hint={t("form.supplierHint")}
              {...form.register("supplyingWarehouseCode")}
            >
              {warehouses.map((warehouse) => (
                <option key={warehouse.code} value={warehouse.code}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </SelectField>
          )}
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <SwitchField
                id="isActive"
                label={t("form.isActive")}
                hint={t("form.isActiveHint")}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
