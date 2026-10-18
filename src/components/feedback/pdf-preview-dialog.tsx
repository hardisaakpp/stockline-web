"use client";

import { Download, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

/** Hides the viewer's thumbnails panel on load (`pagemode` for Firefox's pdf.js, `navpanes` for Chromium's). */
const VIEWER_PARAMS = "#pagemode=none&navpanes=0";

/**
 * A PDF in a large modal (almost the whole viewport), so a page can be read at its real size, with a button to
 * take it to the full viewport. Opens as soon as the PDF is requested and shows a spinner until `url` arrives.
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
  const [maximized, setMaximized] = useState(false);
  const ToggleIcon = maximized ? Minimize2 : Maximize2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "grid-rows-[auto_1fr]",
          maximized
            ? "h-[calc(100dvh-1rem)] sm:max-w-[calc(100vw-1rem)]"
            : "h-[92dvh] sm:max-w-5xl",
        )}
      >
        <DialogHeader className="pr-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMaximized((m) => !m)}>
                <ToggleIcon className="size-4" />
                {maximized ? t("restore") : t("maximize")}
              </Button>
              {url && !loading && (
                <Button variant="outline" size="sm" render={<a href={url} download={filename} />}>
                  <Download className="size-4" />
                  {t("download")}
                </Button>
              )}
            </div>
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
          <iframe
            title={title}
            src={`${url}${VIEWER_PARAMS}`}
            className="size-full min-h-0 rounded-lg border"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
