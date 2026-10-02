"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Person } from "../notification-people";

export function ConfirmRemove({
  person,
  onCancel,
  onConfirm,
}: {
  person: Person | null;
  onCancel: () => void;
  onConfirm: (person: Person) => void;
}) {
  const t = useTranslations("admin.notifications");
  return (
    <Dialog open={person !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("confirmRemoveTitle")}</DialogTitle>
          <DialogDescription>
            {t("confirmRemoveBody", { email: person?.email ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={() => person && onConfirm(person)}>
            {t("confirmRemove")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
