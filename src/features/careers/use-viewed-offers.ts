import { useMemo, useSyncExternalStore } from "react";

const MAX_KEPT = 2000;
const CHANGED = "stockline:viewed-offers";

const keyOf = (userId: string) => `stockline.careers.viewed-offers.${userId}`;

/** The ids stored under `raw`; anything that is not a list of strings is ignored. */
export function parseViewed(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function read(userId: string): string | null {
  try {
    return window.localStorage.getItem(keyOf(userId));
  } catch {
    return null; // storage can be blocked; the page works, it just forgets
  }
}

function write(userId: string, ids: string[]): void {
  try {
    window.localStorage.setItem(keyOf(userId), JSON.stringify(ids.slice(-MAX_KEPT)));
  } catch {
    // ignore: remembering is a convenience
  }
  window.dispatchEvent(new Event(CHANGED));
}

/**
 * Which offers the person already opened, remembered in this browser (one list per person).
 * `mark` is called when they open an offer; `unmark` takes it back.
 */
export function useViewedOffers(userId: string) {
  const raw = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      window.addEventListener(CHANGED, notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener(CHANGED, notify);
      };
    },
    () => read(userId),
    () => null,
  );
  const ids = useMemo(() => parseViewed(raw), [raw]);
  const viewed = useMemo(() => new Set(ids), [ids]);
  return {
    isViewed: (id: string) => viewed.has(id),
    mark: (id: string) => {
      if (!viewed.has(id)) write(userId, [...ids, id]);
    },
    unmark: (id: string) =>
      write(
        userId,
        ids.filter((x) => x !== id),
      ),
  };
}
