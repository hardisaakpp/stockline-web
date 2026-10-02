import type { Subscription } from "./schemas";

export type Person = {
  email: string;
  name: string;
  subscriptions: Subscription[];
};

export type NamedEmail = { email: string; name: string };

type UserLike = { email: string; displayName: string };

/** Subscriptions are stored per email; the screen works per person. */
export function groupPeople(
  subscriptions: Subscription[],
  users: UserLike[],
  topicOrder: string[],
): Person[] {
  const names = new Map(users.map((u) => [u.email.toLowerCase(), u.displayName]));
  const rank = (topic: string) => {
    const index = topicOrder.indexOf(topic);
    return index === -1 ? topicOrder.length : index;
  };
  const byEmail = new Map<string, Person>();
  for (const subscription of subscriptions) {
    const key = subscription.email.toLowerCase();
    const person = byEmail.get(key) ?? {
      email: subscription.email,
      name: names.get(key) ?? subscription.email,
      subscriptions: [],
    };
    person.subscriptions.push(subscription);
    byEmail.set(key, person);
  }
  for (const person of byEmail.values())
    person.subscriptions.sort((a, b) => rank(a.topic) - rank(b.topic));
  return [...byEmail.values()];
}

export function initialsOf(name: string): string {
  const words = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function suggestUsers<T extends UserLike>(
  users: T[],
  query: string,
  taken: Set<string>,
): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return users
    .filter(
      (u) =>
        !taken.has(u.email.toLowerCase()) &&
        `${u.displayName} ${u.email}`.toLowerCase().includes(needle),
    )
    .slice(0, 8);
}

/** A person just picked in the search has no subscription yet: show them first, until they get one. */
export function withPending(saved: Person[], pending: NamedEmail[]): Person[] {
  const known = new Set(saved.map((p) => p.email.toLowerCase()));
  const waiting = pending
    .filter((p) => !known.has(p.email.toLowerCase()))
    .map((p) => ({ ...p, subscriptions: [] }));
  return [...waiting, ...saved];
}

/** People with nothing assigned yet stay visible under every filter, so a new card never vanishes. */
export function filterByAudience(
  people: Person[],
  audience: string | null,
  audienceOf: (topic: string) => string | undefined,
): Person[] {
  if (audience === null) return people;
  return people.filter(
    (p) =>
      p.subscriptions.length === 0 || p.subscriptions.some((s) => audienceOf(s.topic) === audience),
  );
}
