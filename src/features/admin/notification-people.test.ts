import { describe, expect, it } from "vitest";
import {
  filterByAudience,
  groupPeople,
  initialsOf,
  suggestUsers,
  withPending,
  type Person,
} from "./notification-people";

const sub = (id: string, email: string, topic: string) => ({ id, email, topic });
const users = [
  { email: "ana.perez@stockline.test", displayName: "Ana Pérez" },
  { email: "luis@stockline.test", displayName: "Luis Mora" },
];

describe("groupPeople", () => {
  it("groups subscriptions by email regardless of case and orders them by topic", () => {
    const people = groupPeople(
      [sub("1", "Ana.Perez@stockline.test", "B"), sub("2", "ana.perez@stockline.test", "A")],
      users,
      ["A", "B"],
    );
    expect(people).toHaveLength(1);
    expect(people[0]?.subscriptions.map((s) => s.topic)).toEqual(["A", "B"]);
  });

  it("uses the user's name when the email belongs to one, the email otherwise", () => {
    const [ana, outside] = groupPeople(
      [sub("1", "ana.perez@stockline.test", "A"), sub("2", "proveedor@example.com", "A")],
      users,
      ["A"],
    );
    expect(ana?.name).toBe("Ana Pérez");
    expect(outside?.name).toBe("proveedor@example.com");
  });

  it("sends unknown topics to the end", () => {
    const [p] = groupPeople([sub("1", "x@y.zz", "Z"), sub("2", "x@y.zz", "A")], [], ["A"]);
    expect(p?.subscriptions.map((s) => s.topic)).toEqual(["A", "Z"]);
  });
});

describe("initialsOf", () => {
  it.each([
    ["Ana Pérez", "AP"],
    ["ana.perez@stockline.test", "AP"],
    ["luis", "L"],
    ["", ""],
  ])("%s -> %s", (name, expected) => expect(initialsOf(name)).toBe(expected));
});

describe("suggestUsers", () => {
  it("matches name or email, skips people already on screen, caps the list", () => {
    expect(suggestUsers(users, "pér", new Set()).map((u) => u.displayName)).toEqual(["Ana Pérez"]);
    expect(suggestUsers(users, "stockline", new Set(["luis@stockline.test"]))).toHaveLength(1);
    expect(suggestUsers(users, "  ", new Set())).toEqual([]);
  });
});

describe("pending people and filters", () => {
  const saved: Person[] = [
    { email: "a@x.zz", name: "a@x.zz", subscriptions: [sub("1", "a@x.zz", "T")] },
  ];

  it("shows a new person first and drops them once they have a subscription", () => {
    const pending = [
      { email: "new@x.zz", name: "New" },
      { email: "A@x.zz", name: "A" },
    ];
    expect(withPending(saved, pending).map((p) => p.email)).toEqual(["new@x.zz", "a@x.zz"]);
  });

  it("keeps people without subscriptions under every audience filter", () => {
    const people = withPending(saved, [{ email: "new@x.zz", name: "New" }]);
    const audienceOf = (topic: string) => (topic === "T" ? "Buyer" : undefined);
    expect(filterByAudience(people, "Supplier", audienceOf).map((p) => p.email)).toEqual([
      "new@x.zz",
    ]);
    expect(filterByAudience(people, "Buyer", audienceOf)).toHaveLength(2);
    expect(filterByAudience(people, null, audienceOf)).toHaveLength(2);
  });
});
