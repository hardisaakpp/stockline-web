"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { correctProductCode } from "../actions.server";
import { useErrorMessage } from "@/lib/actions/use-error-message";

/** Replaces a product code the ERP rejected so the submission can be retried. */
export function CorrectCodeForm({
  orderId,
  productCodes,
}: {
  orderId: string;
  productCodes: readonly string[];
}) {
  const t = useTranslations("orders.erp");
  const describe = useErrorMessage();
  const [current, setCurrent] = useState(productCodes[0] ?? "");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await correctProductCode(orderId, current, next.trim());
      if (result.ok) {
        toast.success(t("codeCorrected"));
        setNext("");
      } else {
        setError(describe(result.error));
      }
    });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-3 rounded-xl border bg-card p-4"
    >
      <div>
        <h3 className="font-medium">{t("fixCodesTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("fixCodesIntro")}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56 space-y-1">
          <Label htmlFor="current-code" className="text-xs text-muted-foreground">
            {t("currentCode")}
          </Label>
          <NativeSelect
            id="current-code"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            className="h-9"
          >
            {productCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-56 space-y-1">
          <Label htmlFor="new-code" className="text-xs text-muted-foreground">
            {t("newCode")}
          </Label>
          <Input
            id="new-code"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            maxLength={60}
            className="h-9"
          />
        </div>
        <Button type="submit" disabled={pending || next.trim() === "" || next.trim() === current}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {t("apply")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
