"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { suggestUsers } from "../notification-people";

type Candidate = { email: string; displayName: string };

/** Finds a registered user, or accepts any email (suppliers have no account here). */
export function PeopleSearch({
  users,
  taken,
  onPick,
}: {
  users: Candidate[];
  taken: Set<string>;
  onPick: (person: { email: string; name: string }) => void;
}) {
  const t = useTranslations("admin.notifications");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);
  const suggestions = suggestUsers(users, query, taken);

  const reset = () => {
    setQuery("");
    setOpen(false);
    setActive(0);
    setError(false);
  };
  const pickUser = (user: Candidate) => {
    onPick({ email: user.email, name: user.displayName });
    reset();
  };
  const confirm = () => {
    const suggestion = suggestions[active];
    if (suggestion) return pickUser(suggestion);
    const email = query.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(true);
    if (taken.has(email.toLowerCase())) return reset();
    onPick({ email, name: email });
    reset();
  };
  const move = (delta: number) =>
    suggestions.length > 0 && setActive((active + delta + suggestions.length) % suggestions.length);

  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open && query.length > 0}
          aria-controls="people-suggestions"
          aria-label={t("searchLabel")}
          aria-invalid={error || undefined}
          value={query}
          placeholder={t("searchPlaceholder")}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setError(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              confirm();
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              move(event.key === "ArrowDown" ? 1 : -1);
            }
          }}
          className="h-9 w-full rounded-lg border bg-background pr-8 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={reset}
            aria-label={t("clearSearch")}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
        {open && query.length > 0 && (
          <ul
            id="people-suggestions"
            role="listbox"
            className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg"
          >
            {suggestions.length === 0 && (
              <li className="px-3 py-2 text-xs text-muted-foreground">{t("noMatches")}</li>
            )}
            {suggestions.map((user, index) => (
              <li key={user.email} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickUser(user)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                    index === active && "bg-primary/10 text-primary",
                  )}
                >
                  {user.displayName} ({user.email})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-destructive">
          {t("validation.emailInvalid")}
        </p>
      )}
    </div>
  );
}
