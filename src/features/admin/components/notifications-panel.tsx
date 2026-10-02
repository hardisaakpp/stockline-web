"use client";

import { Eye, Loader2, Mail, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorMessage } from "@/lib/actions/use-error-message";
import { previewEmail, subscribeEmail, unsubscribeEmail } from "../actions.server";
import { subscribeSchema } from "../forms";
import type { EmailPreview, EmailTopic, Subscription } from "../schemas";

const KNOWN_TOPICS = [
  "OrderSubmitted",
  "OrderCancelledByBuyer",
  "OrderRejected",
  "OrderDiscarded",
  "OrderCancelledBySupplier",
] as const;
const KNOWN_AUDIENCES = ["Buyer", "Supplier", "SupplierProduction"] as const;
const isIn = <T extends readonly string[]>(list: T, value: string): value is T[number] =>
  (list as readonly string[]).includes(value);

export function NotificationsPanel({
  topics,
  subscriptions,
}: {
  topics: EmailTopic[];
  subscriptions: Subscription[];
}) {
  const [preview, setPreview] = useState<EmailPreview | null>(null);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {topics.map((topic) => (
          <TopicCard
            key={topic.topic}
            topic={topic}
            subscriptions={subscriptions.filter((s) => s.topic === topic.topic)}
            onPreview={setPreview}
          />
        ))}
      </div>
      <PreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function TopicCard({
  topic,
  subscriptions,
  onPreview,
}: {
  topic: EmailTopic;
  subscriptions: Subscription[];
  onPreview: (preview: EmailPreview) => void;
}) {
  const t = useTranslations("admin.notifications");
  const describe = useErrorMessage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const key = isIn(KNOWN_TOPICS, topic.topic) ? topic.topic : null;
  const title = key ? t(`topics.${key}.title`) : topic.subject;
  const audience = isIn(KNOWN_AUDIENCES, topic.audience)
    ? t(`audiences.${topic.audience}`)
    : topic.audience;

  const add = () => {
    const parsed = subscribeSchema.safeParse({ email, topic: topic.topic });
    if (!parsed.success) return setError(t("validation.emailInvalid"));
    setError(null);
    startTransition(async () => {
      const result = await subscribeEmail(parsed.data);
      if (!result.ok) return setError(describe(result.error));
      toast.success(t("added"));
      setEmail("");
    });
  };
  const remove = (subscription: Subscription) =>
    startTransition(async () => {
      const result = await unsubscribeEmail(subscription.id);
      if (result.ok) toast.success(t("removed"));
      else toast.error(describe(result.error));
    });
  const showPreview = () =>
    startTransition(async () => {
      const result = await previewEmail(topic.topic);
      if (result.ok) onPreview(result.data);
      else toast.error(describe(result.error));
    });

  const inputId = `subscribe-${topic.topic}`;
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {key ? t(`topics.${key}.description`) : topic.description}
          </p>
          <p className="text-xs text-muted-foreground">{t("audience", { audience })}</p>
        </div>
        <Button variant="outline" size="sm" onClick={showPreview} disabled={pending}>
          <Eye className="size-4" />
          {t("preview")}
        </Button>
      </header>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {t("subscribers", { count: subscriptions.length })}
        </p>
        <SubscriberList subscriptions={subscriptions} pending={pending} onRemove={remove} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
        className="space-y-1"
      >
        <Label htmlFor={inputId} className="sr-only">
          {t("addLabel", { topic: title })}
        </Label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            aria-invalid={error ? true : undefined}
            className="h-9"
          />
          <Button type="submit" disabled={pending || email.trim() === ""}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("add")}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

function PreviewDialog({
  preview,
  onClose,
}: {
  preview: EmailPreview | null;
  onClose: () => void;
}) {
  const t = useTranslations("admin.notifications");

  return (
    <Dialog open={preview !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("previewTitle")}</DialogTitle>
          <DialogDescription>{preview?.subject ?? t("previewHint")}</DialogDescription>
        </DialogHeader>
        {preview && (
          // Sandboxed with no permissions: the HTML is rendered, but nothing in it can run.
          <iframe
            title={preview.subject}
            srcDoc={preview.html}
            sandbox=""
            className="h-96 w-full rounded-lg border bg-white"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubscriberList({
  subscriptions,
  pending,
  onRemove,
}: {
  subscriptions: Subscription[];
  pending: boolean;
  onRemove: (subscription: Subscription) => void;
}) {
  const t = useTranslations("admin.notifications");

  if (subscriptions.length === 0)
    return <p className="text-sm text-muted-foreground">{t("noSubscribers")}</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {subscriptions.map((subscription) => (
        <li
          key={subscription.id}
          className="inline-flex items-center gap-1.5 rounded-full border bg-background py-1 pr-1 pl-3 text-sm"
        >
          <Mail className="size-3.5 text-muted-foreground" />
          {subscription.email}
          <button
            type="button"
            onClick={() => onRemove(subscription)}
            disabled={pending}
            aria-label={t("remove", { email: subscription.email })}
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
