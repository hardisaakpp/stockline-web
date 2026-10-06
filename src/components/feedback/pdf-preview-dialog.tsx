"use client";

import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PdfPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Blob or object URL of the PDF; null while it is still being generated. */
  url: string | null;
  /** The PDF is being generated: a spinner shows instead of the document. */
  loading?: boolean;
  /** Name offered by the download button. */
  filename?: string;
};

/**
 * A PDF in a large modal (almost the whole viewport), so a page can be read at its real size.
 * Opens as soon as the PDF is requested and shows a spinner until `url` arrives.
 */
export function PdfPreviewDialog({
  open,
  onOpenChange,
  title,
  url,
  loading = false,
  filename = "documento.pdf",
}: PdfPreviewDialogProps) {
  const t = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92dvh] grid-rows-[auto_1fr] sm:max-w-5xl">
        <DialogHeader className="pr-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle>{title}</DialogTitle>
            {url && !loading && (
              <Button variant="outline" size="sm" render={<a href={url} download={filename} />}>
                <Download className="size-4" />
                {t("download")}
              </Button>
            )}
          </div>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        {loading || !url ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            {t("generatingPdf")}
          </div>
        ) : (
          <iframe title={title} src={url} className="size-full min-h-0 rounded-lg border" />
        )}
      </DialogContent>
    </Dialog>
  );
}
