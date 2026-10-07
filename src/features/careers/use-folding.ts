import { useState } from "react";

/**
 * Which panels of a form are collapsed. `fold(id)` gives a panel the props it needs; `collapseAll` and `expandAll`
 * act on every id at once. Everything starts expanded.
 */
export function useFolding<Id extends string>(ids: readonly Id[]) {
  const [closed, setClosed] = useState<ReadonlySet<Id>>(new Set());

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
