"use client";

import { FileText, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../chat-state";
import { describeWait } from "../wait";
import { MarkdownText } from "./markdown-text";
import { XiaAvatar } from "./xia-avatar";

type Props = {
  message: ChatMessage;
  disabled: boolean;
  onRetry: (errorId: string, question: string) => void;
};

type ErrorMessage = Extract<ChatMessage, { role: "error" }>;

function ErrorBubble({
  message,
  disabled,
  onRetry,
}: Omit<Props, "message"> & { message: ErrorMessage }) {
  const t = useTranslations("assistant");

  const wait =
    message.retryAfterSeconds === undefined ? null : describeWait(message.retryAfterSeconds);
  const text =
    message.code === "quotaExhausted"
      ? wait
        ? t("errors.quotaExhausted", { wait: t(`wait.${wait.unit}`, { count: wait.count }) })
        : t("errors.quotaExhaustedShort")
      : t(`errors.${message.code}`);
  // Nothing to gain from asking again until the limit renews or the account is fixed.
  const canRetry = !["quotaExhausted", "noAccess", "notConfigured", "unauthorized"].includes(
    message.code,
  );

  return (
    <div className="flex gap-2">
      <XiaAvatar className="bg-destructive/10 text-destructive" />
      <div role="alert" className="space-y-2 rounded-2xl rounded-tl-sm bg-destructive/10 px-3 py-2">
        <p className="flex items-start gap-2 text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{text}</span>
        </p>
        {canRetry && (
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onRetry(message.id, message.question)}
          >
            {t("retry")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ChatMessageView(props: Props) {
  const t = useTranslations("assistant");
  const { message } = props;

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 whitespace-pre-wrap text-primary-foreground">
          <span className="sr-only">{t("you")}: </span>
          {message.text}
        </p>
      </div>
    );
  }

  if (message.role === "error") return <ErrorBubble {...props} message={message} />;

  const { answer } = message;
  return (
    <div className="flex gap-2">
      <XiaAvatar />
      <div className="max-w-[85%] min-w-0 space-y-2">
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm bg-muted px-3 py-2",
            answer.noAnswer && "text-muted-foreground",
          )}
        >
          <span className="sr-only">{t("title")}: </span>
          {answer.noAnswer ? t("noAnswerText") : <MarkdownText text={answer.text} />}
        </div>
        {answer.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t("sources")}:</span>
            {answer.sources.map((source) => (
              <span
                key={source.path}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5"
              >
                <FileText className="size-3" aria-hidden="true" />
                {source.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
