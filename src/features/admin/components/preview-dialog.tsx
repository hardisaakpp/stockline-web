"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EmailPreview } from "../schemas";

export function PreviewDialog({
  preview,
  onClose,
}: {
  preview: EmailPreview | null;
  onClose: () => void;
}) {
  const t = useTranslations("admin.notifications");

  return (
    <Dialog open={preview !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("previewTitle")}</DialogTitle>
          <DialogDescription>{preview?.subject ?? t("previewHint")}</DialogDescription>
        </DialogHeader>
        {preview && (
          // Sandboxed with no permissions: the HTML is rendered, but nothing in it can run.
          <iframe
            title={preview.subject}
            srcDoc={preview.html}
            sandbox=""
            className="h-96 w-full rounded-lg border bg-white"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
