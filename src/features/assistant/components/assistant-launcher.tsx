"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useChat } from "../use-chat";
import { ChatPanel } from "./chat-panel";
import { XiaAvatar } from "./xia-avatar";

/**
 * The assistant: a floating button that opens a side panel. It mounts once in the app layout, so the
 * conversation survives navigation between pages and closing the panel.
 */
export function AssistantLauncher({ permissions }: { permissions: readonly string[] }) {
  const t = useTranslations("assistant");
  const chat = useChat();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="lg"
            className="fixed right-4 bottom-4 z-40 h-12 gap-2 rounded-full px-4 shadow-lg sm:right-6 sm:bottom-6"
            aria-label={t("open")}
          />
        }
      >
        <Sparkles className="size-5" aria-hidden="true" />
        <span className="hidden sm:inline">{t("open")}</span>
      </SheetTrigger>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="flex-row items-center gap-3 border-b p-4 pr-12">
          <XiaAvatar className="size-9" />
          <div className="min-w-0">
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription className="line-clamp-2 text-xs">{t("description")}</SheetDescription>
          </div>
        </SheetHeader>
        <ChatPanel chat={chat} permissions={permissions} />
      </SheetContent>
    </Sheet>
  );
}
