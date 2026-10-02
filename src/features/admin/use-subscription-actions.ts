"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/result";
import { useErrorMessage } from "@/lib/actions/use-error-message";
import { previewEmail, subscribeEmail, unsubscribeEmail } from "./actions.server";
import type { Person } from "./notification-people";
import type { EmailPreview, EmailTopic, Subscription } from "./schemas";
import { useTopicLabels } from "./topic-labels";

/** Server calls behind the screen, each with its toast and a per-person "busy" marker. */
export function useSubscriptionActions(topicByKey: Map<string, EmailTopic>) {
  const t = useTranslations("admin.notifications");
  const labels = useTopicLabels();
  const describe = useErrorMessage();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<EmailPreview | null>(null);

  const run = (key: string, action: () => Promise<ActionResult<unknown>>, success?: string) =>
    startTransition(async () => {
      setBusy(key);
      const result = await action();
      setBusy(null);
      if (!result.ok) toast.error(describe(result.error));
      else if (success) toast.success(success);
    });

  return {
    busy,
    preview,
    closePreview: () => setPreview(null),
    assign(person: Person, topic: string) {
      const known = topicByKey.get(topic);
      const title = known ? labels.title(known) : topic;
      if (person.subscriptions.some((s) => s.topic === topic))
        return toast.error(t("alreadySubscribed", { email: person.email, topic: title }));
      run(person.email, () => subscribeEmail({ email: person.email, topic }), t("added"));
    },
    unsubscribe(person: Person, subscription: Subscription) {
      run(person.email, () => unsubscribeEmail(subscription.id), t("removed"));
    },
    removeAll(person: Person) {
      run(
        person.email,
        async () => {
          for (const s of person.subscriptions) {
            const result = await unsubscribeEmail(s.id);
            if (!result.ok) return result;
          }
          return { ok: true, data: undefined };
        },
        t("removed"),
      );
    },
    showPreview(topic: EmailTopic) {
      startTransition(async () => {
        const result = await previewEmail(topic.topic);
        if (result.ok) setPreview(result.data);
        else toast.error(describe(result.error));
      });
    },
  };
}
