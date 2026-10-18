import { useEffect, useRef, useState } from "react";

/** Ids stored under `key` that are still valid panels; anything else (corrupt JSON, removed sections) is dropped. */
export function parseClosed<Id extends string>(raw: string | null, ids: readonly Id[]): Set<Id> {
  if (!raw) return new Set();
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return new Set();
    return new Set(ids.filter((id) => value.includes(id)));
  } catch {
    return new Set();
  }
}

function load<Id extends string>(key: string, ids: readonly Id[]): Set<Id> {
  try {
    return parseClosed(window.localStorage.getItem(key), ids);
  } catch {
    return new Set(); // storage can be blocked (private windows); the panels still work without it
  }
}

function save(key: string, closed: ReadonlySet<string>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify([...closed]));
  } catch {
    // ignore: remembering is a convenience
  }
}

/**
 * Which panels of a form are collapsed. `fold(id)` gives a panel the props it needs; `collapseAll` and `expandAll`
 * act on every id at once. Everything starts expanded, and the last choice of each panel is remembered in
 * `localStorage` under `storageKey`.
 */
export function useFolding<Id extends string>(ids: readonly Id[], storageKey: string) {
  const [closed, setClosed] = useState<ReadonlySet<Id>>(new Set());
  const firstRun = useRef(true);

  // Not read during the first render: the server has no localStorage and the client must hydrate to the same markup.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync from an external store
    setClosed(load(storageKey, ids));
    // Only on mount: `ids` is a constant list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // The mount run is skipped: the initial empty set must not overwrite what was saved before the restore lands.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    save(storageKey, closed);
  }, [closed, storageKey]);

  const toggle = (id: Id) =>
    setClosed((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return {
    fold: (id: Id) => ({ id, collapsed: closed.has(id), onToggleCollapse: () => toggle(id) }),
    collapseAll: () => setClosed(new Set(ids)),
    expandAll: () => setClosed(new Set()),
  };
}
