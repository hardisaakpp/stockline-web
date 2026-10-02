"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { suggestionsFor } from "../suggestions";
import type { useChat } from "../use-chat";
import { ChatMessageView } from "./chat-message";
import { XiaAvatar } from "./xia-avatar";

type Chat = ReturnType<typeof useChat>;

/** Cold start of the model can take a while; after this long the person is told why. */
const SLOW_AFTER_MS = 8000;

function Welcome({
  permissions,
  onPick,
}: {
  permissions: readonly string[];
  onPick: (q: string) => void;
}) {
  const t = useTranslations("assistant");
  return (
    <div className="flex flex-col items-center gap-3 px-2 pt-6 text-center">
      <XiaAvatar className="size-12 [&>svg]:size-6" />
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t("welcomeTitle")}</h3>
        <p className="text-muted-foreground">{t("welcomeBody")}</p>
      </div>
      <div className="mt-2 w-full space-y-2 text-left">
        <p className="text-xs font-medium text-muted-foreground">{t("suggestionsLabel")}</p>
        {suggestionsFor(permissions).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(t(`suggestions.${key}`))}
            className="block w-full rounded-lg border bg-background px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t(`suggestions.${key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  const t = useTranslations("assistant");
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex gap-2" role="status">
      <XiaAvatar className="animate-pulse" />
      <p className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-muted-foreground">
        {t("thinking")}
        {slow && <span className="mt-1 block text-xs">{t("slow")}</span>}
      </p>
    </div>
  );
}

function Composer({ pending, onSend }: { pending: boolean; onSend: (q: string) => void }) {
  const t = useTranslations("assistant");
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || pending) return;
    onSend(value);
    setValue("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          aria-label={t("input.label")}
          placeholder={t("input.placeholder")}
          maxLength={1000}
          rows={2}
          className="max-h-32 min-h-0 resize-none"
        />
        <Button
          size="icon"
          onClick={submit}
          disabled={pending || !value.trim()}
          aria-label={t("input.send")}
        >
          <Send className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
    </div>
  );
}

export function ChatPanel({ chat, permissions }: { chat: Chat; permissions: readonly string[] }) {
  const t = useTranslations("assistant");
  const { messages, pending, quota, send, retry, reset } = chat;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);

  return (
    <>
      <div role="log" aria-live="polite" className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <Welcome permissions={permissions} onPick={(q) => void send(q)} />
        )}
        {messages.map((message) => (
          <ChatMessageView key={message.id} message={message} disabled={pending} onRetry={retry} />
        ))}
        {pending && <Thinking />}
        <div ref={endRef} />
      </div>
      <div className="space-y-2 border-t p-4">
        <Composer pending={pending} onSend={(q) => void send(q)} />
        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            className={cn(
              "text-muted-foreground",
              quota?.warning && "font-medium text-destructive",
            )}
          >
            {quota && t("quota.left", { remaining: quota.remaining, limit: quota.limit })}
          </span>
          {messages.length > 0 && (
            <Button variant="ghost" size="xs" onClick={reset} disabled={pending}>
              {t("newConversation")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
