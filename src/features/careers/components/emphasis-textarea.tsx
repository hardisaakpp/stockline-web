"use client";

import { Bold } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toggleEmphasis } from "../emphasis";

/** Sets a controlled textarea's value the way typing does, so the owner's `onChange` runs with the new text. */
function typeInto(element: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * A textarea where the selected text can be put in bold in the PDF: the «Bold» button or Ctrl/⌘+B wrap it in
 * `**marks**` (and take them off again). It behaves as a plain `Textarea` for its owner.
 */
export function EmphasisTextarea({ onKeyDown, ...props }: ComponentProps<typeof Textarea>) {
  const t = useTranslations("careers.cv.emphasis");
  const ref = useRef<HTMLTextAreaElement>(null);

  const apply = () => {
    const element = ref.current;
    if (!element) return;
    const edit = toggleEmphasis(element.value, element.selectionStart, element.selectionEnd);
    if (!edit) return;
    typeInto(element, edit.value);
    element.setSelectionRange(edit.start, edit.end);
  };

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        {...props}
        ref={ref}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
            event.preventDefault();
            apply();
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="self-end text-muted-foreground"
        title={t("title")}
        // Keeps the selection: a click would otherwise move the focus away from the text first.
        onMouseDown={(event) => event.preventDefault()}
        onClick={apply}
      >
        <Bold />
        {t("button")}
      </Button>
    </div>
  );
}
