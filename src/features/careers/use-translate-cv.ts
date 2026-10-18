"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { ActionError } from "@/lib/actions/result";
import { translateCv } from "./actions.server";
import type { Translation } from "./schemas";

/**
 * Asks for an English draft of the saved Spanish CV. `dirty` is whether the form has unsaved work the draft would
 * replace: the person is asked first. `onStart`, `onDone` and `onError` are the editor's reactions.
 */
export function useTranslateCv({
  dirty,
  onStart,
  onDone,
  onError,
}: {
  dirty: boolean;
  onStart: () => void;
  onDone: (translation: Translation) => void;
  onError: (error: ActionError) => void;
}) {
  const t = useTranslations("careers.cv.translate");
  const [, startTransition] = useTransition();
  return () => {
    if (dirty && !window.confirm(t("confirm"))) return;
    onStart();
    startTransition(async () => {
      const result = await translateCv();
      if (result.ok) onDone(result.data as Translation);
      else onError(result.error);
    });
  };
}
