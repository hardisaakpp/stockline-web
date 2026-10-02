"use client";

import { Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const REFRESH_DEBOUNCE_MS = 300;

/**
 * Keeps the page current: listens to the order's event stream (through the BFF, which holds the
 * session token) and re-renders the server data whenever someone changes the order.
 */
export function LiveUpdates({ orderId }: { orderId: string }) {
  const t = useTranslations("orders.detail");
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  // The translator changes identity on every render; keeping it out of the effect's dependencies
  // stops the stream from being closed and reopened (and events from being missed) on each render.
  const message = useRef(t("liveUpdated"));
  useEffect(() => {
    message.current = t("liveUpdated");
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let everConnected = false;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        router.refresh();
        toast.info(message.current);
      }, REFRESH_DEBOUNCE_MS);
    };

    const source = new EventSource(
      `/api/bff/notifications/stream?orderId=${encodeURIComponent(orderId)}`,
    );
    source.onopen = () => {
      setConnected(true);
      // After a reconnect, changes made while the stream was down were never announced.
      if (everConnected) router.refresh();
      everConnected = true;
    };
    // The browser reconnects by itself; until it does, the badge shows the page is not live.
    source.onerror = () => setConnected(false);
    source.addEventListener("order.updated", refresh);
    return () => {
      clearTimeout(timer);
      source.close();
    };
  }, [orderId, router]);

  return (
    <span
      title={t("liveHint")}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${
        connected
          ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
          : "text-muted-foreground"
      }`}
    >
      <Radio className={`size-3 ${connected ? "animate-pulse" : ""}`} />
      {t("live")}
    </span>
  );
}
