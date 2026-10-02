"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  filterByAudience,
  groupPeople,
  withPending,
  type NamedEmail,
  type Person,
} from "../notification-people";
import type { EmailTopic, Subscription } from "../schemas";
import { useSubscriptionActions } from "../use-subscription-actions";
import { AudienceFilter } from "./audience-filter";
import { ConfirmRemove } from "./confirm-remove";
import { PeopleSearch } from "./people-search";
import { PersonCard, type DropState } from "./person-card";
import { PreviewDialog } from "./preview-dialog";
import { TopicCatalog } from "./topic-catalog";

type UserLike = { email: string; displayName: string };

export function NotificationsPanel({
  topics,
  subscriptions,
  users,
}: {
  topics: EmailTopic[];
  subscriptions: Subscription[];
  users: UserLike[];
}) {
  const t = useTranslations("admin.notifications");
  const [pending, setPending] = useState<NamedEmail[]>([]);
  const [audience, setAudience] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<Person | null>(null);

  const topicByKey = useMemo(() => new Map(topics.map((x) => [x.topic, x])), [topics]);
  const actions = useSubscriptionActions(topicByKey);
  const people = useMemo(
    () =>
      withPending(
        groupPeople(
          subscriptions,
          users,
          topics.map((x) => x.topic),
        ),
        pending,
      ),
    [subscriptions, users, topics, pending],
  );
  const audiences = [...new Set(topics.map((x) => x.audience))];
  const visible = filterByAudience(people, audience, (key) => topicByKey.get(key)?.audience);
  const holding = dragging ?? selected;

  const drop = (person: Person): DropState => {
    if (over !== person.email || !holding) return "idle";
    return person.subscriptions.some((s) => s.topic === holding) ? "blocked" : "allowed";
  };
  const finishDrag = () => {
    setDragging(null);
    setOver(null);
  };
  const removePerson = (person: Person) => {
    setToRemove(null);
    // A person added from the search lives in `pending` too; removing them must clear both.
    setPending((list) => list.filter((p) => p.email.toLowerCase() !== person.email.toLowerCase()));
    if (person.subscriptions.length > 0) actions.removeAll(person);
  };

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4 self-stretch">
        <PeopleSearch
          users={users}
          taken={new Set(people.map((p) => p.email.toLowerCase()))}
          onPick={(person) => setPending((list) => [...list, person])}
        />

        <AudienceFilter audiences={audiences} active={audience} onChange={setAudience} />

        {visible.length === 0 ? (
          <p className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
            {people.length === 0 ? t("noPeople") : t("noPeopleFiltered")}
          </p>
        ) : (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
          >
            {visible.map((person) => (
              <PersonCard
                key={person.email}
                person={person}
                topics={topicByKey}
                busy={actions.busy === person.email}
                drop={drop(person)}
                holding={holding !== null}
                onDragOver={() => setOver(person.email)}
                onDragLeave={() => setOver((cur) => (cur === person.email ? null : cur))}
                onDrop={() => {
                  const topic = dragging;
                  finishDrag();
                  if (topic) actions.assign(person, topic);
                }}
                onClick={() => {
                  const topic = selected;
                  setSelected(null);
                  if (topic) actions.assign(person, topic);
                }}
                onRemoveSubscription={(s) => actions.unsubscribe(person, s)}
                onRemovePerson={() =>
                  person.subscriptions.length === 0 ? removePerson(person) : setToRemove(person)
                }
              />
            ))}
          </div>
        )}
      </div>

      <TopicCatalog
        topics={topics}
        selected={selected}
        onSelect={(topic) => setSelected((cur) => (cur === topic ? null : topic))}
        onDragStart={(topic, event) => {
          setDragging(topic);
          event.dataTransfer.effectAllowed = "copy";
          event.dataTransfer.setData("text/plain", topic);
        }}
        onDragEnd={finishDrag}
        onPreview={actions.showPreview}
      />

      <PreviewDialog preview={actions.preview} onClose={actions.closePreview} />
      <ConfirmRemove
        person={toRemove}
        onCancel={() => setToRemove(null)}
        onConfirm={removePerson}
      />
    </div>
  );
}
