"use client";

import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { initialsOf, type Person } from "../notification-people";
import { paletteFor } from "../notification-palette";
import type { EmailTopic, Subscription } from "../schemas";
import { useTopicLabels } from "../topic-labels";

export type DropState = "idle" | "allowed" | "blocked";

export function PersonCard({
  person,
  topics,
  busy,
  drop,
  holding,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onRemoveSubscription,
  onRemovePerson,
}: {
  person: Person;
  topics: Map<string, EmailTopic>;
  busy: boolean;
  drop: DropState;
  /** A topic is being dragged or selected: the card is a target. */
  holding: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onClick: () => void;
  onRemoveSubscription: (subscription: Subscription) => void;
  onRemovePerson: () => void;
}) {
  const t = useTranslations("admin.notifications");
  const first = person.subscriptions[0];
  const firstTopic = first ? topics.get(first.topic) : undefined;

  return (
    // The card is a drop target for the mouse; keyboard users reach the same action by selecting a topic in the catalogue and pressing the card's name button.
    <article
      data-testid="person-card"
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = drop === "blocked" ? "none" : "copy";
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={cn(
        "relative rounded-lg border bg-card p-4 transition-all",
        drop === "allowed" && "border-primary ring-2 ring-primary/25",
        drop === "blocked" && "border-destructive ring-2 ring-destructive/20",
        busy && "opacity-60",
        holding && drop === "blocked" && "cursor-not-allowed",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onClick}
          disabled={!holding}
          className="flex min-w-0 items-center gap-2.5 text-left disabled:cursor-default"
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              firstTopic
                ? `${paletteFor(firstTopic.audience).circle} text-white`
                : "border-2 border-dashed text-muted-foreground",
            )}
          >
            {initialsOf(person.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{person.name}</span>
            {person.name !== person.email && (
              <span className="block truncate text-xs text-muted-foreground">{person.email}</span>
            )}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
          <button
            type="button"
            onClick={onRemovePerson}
            disabled={busy}
            aria-label={t("removePerson", { email: person.email })}
            className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <SubscriptionBadges
        person={person}
        topics={topics}
        busy={busy}
        onRemove={onRemoveSubscription}
      />
    </article>
  );
}

function SubscriptionBadges({
  person,
  topics,
  busy,
  onRemove,
}: {
  person: Person;
  topics: Map<string, EmailTopic>;
  busy: boolean;
  onRemove: (subscription: Subscription) => void;
}) {
  const t = useTranslations("admin.notifications");
  const labels = useTopicLabels();
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
      {person.subscriptions.length === 0 && (
        <span className="text-xs text-muted-foreground">{t("noAssigned")}</span>
      )}
      {person.subscriptions.map((subscription) => {
        const topic = topics.get(subscription.topic);
        const title = topic ? labels.title(topic) : subscription.topic;
        return (
          <span
            key={subscription.id}
            title={topic ? labels.description(topic) : undefined}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs",
              paletteFor(topic?.audience ?? "").badge,
            )}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                paletteFor(topic?.audience ?? "").dot,
              )}
            />
            {title}
            <button
              type="button"
              onClick={() => onRemove(subscription)}
              disabled={busy}
              aria-label={t("removeTopic", { topic: title, email: person.email })}
              className="opacity-60 hover:opacity-100 disabled:opacity-40"
            >
              ×
            </button>
          </span>
        );
      })}
    </div>
  );
}
