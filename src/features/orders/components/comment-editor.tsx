"use client";

import { Loader2, MessageSquare, MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions/result";
import { useErrorMessage } from "@/lib/actions/use-error-message";

const MAX_LENGTH = 500;

type Props = {
  comment: string | null | undefined;
  productCode: string;
  /** Read-only viewers still see the comment, they just cannot change it. */
  editable: boolean;
  onSave: (comment: string | null) => Promise<ActionResult<unknown>>;
};

export function CommentEditor({ comment, productCode, editable, onSave }: Props) {
  const t = useTranslations("orders");
  const describe = useErrorMessage();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(comment ?? "");
  const [pending, startTransition] = useTransition();
  const has = Boolean(comment);

  if (!editable) {
    return has ? (
      <span
        className="inline-flex max-w-48 items-start gap-1.5 text-xs text-muted-foreground"
        title={comment ?? undefined}
      >
        <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
        <span className="line-clamp-2 whitespace-normal">{comment}</span>
      </span>
    ) : null;
  }

  const save = () =>
    startTransition(async () => {
      const result = await onSave(text.trim() || null);
      if (result.ok) {
        setOpen(false);
        toast.success(t("lines.saved"));
      } else {
        toast.error(describe(result.error));
      }
    });

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setText(comment ?? "");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${has ? t("lines.editComment") : t("lines.addComment")}: ${productCode}`}
            title={comment ?? t("lines.addComment")}
          />
        }
      >
        {has ? (
          <MessageSquare className="size-4 text-primary" />
        ) : (
          <MessageSquarePlus className="size-4 text-muted-foreground" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <Textarea
          value={text}
          maxLength={MAX_LENGTH}
          rows={4}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("lines.commentPlaceholder")}
          aria-label={t("lines.commentFor", { product: productCode })}
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">
            {text.length}/{MAX_LENGTH}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={save} disabled={pending || text.trim() === (comment ?? "")}>
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
