/** Moves the element at `from` so that it ends up at `to` (a position in the resulting list). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from === to || from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/**
 * Where the dragged element lands when dropped on the `over` row: before it, or after it when the pointer is
 * on its lower half. Returns the final position, which equals `from` when nothing would change.
 */
export function dropPosition(from: number, over: number, after: boolean): number {
  const insertAt = over + (after ? 1 : 0);
  return from < insertAt ? insertAt - 1 : insertAt;
}
