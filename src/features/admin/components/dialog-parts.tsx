"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ROLES } from "@/features/auth";

export type Common = { open: boolean; onOpenChange: (open: boolean) => void };
type ValidationKey = "emailInvalid" | "nameRequired" | "passwordShort";

export function useFieldMessage() {
  const t = useTranslations("admin.users.validation");
  return (message?: string) => (message ? t(message as ValidationKey) : undefined);
}

export function RoleOptions() {
  const t = useTranslations("admin.roles.roles");
  return ROLES.map((role) => (
    <option key={role} value={role}>
      {t(role)}
    </option>
  ));
}

export function FormError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

export function SubmitFooter({
  pending,
  label,
  pendingLabel,
  onCancel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  onCancel: () => void;
}) {
  const t = useTranslations("admin.common");
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
        {t("cancel")}
      </Button>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? pendingLabel : label}
      </Button>
    </DialogFooter>
  );
}
