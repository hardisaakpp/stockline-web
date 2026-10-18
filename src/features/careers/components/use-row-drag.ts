import { useState, type DragEvent, type KeyboardEvent } from "react";
import { dropPosition } from "../reorder";

/** The row being dragged, the row the pointer is over, and whether it is on that row's lower half. */
type Drag = { from: number; over: number; after: boolean };

/**
 * Drag-and-drop (and ↑ ↓) reordering of a list of rows. `move(from, to)` does the actual change; this only
 * tracks the gesture. `bar(index)` says on which edge of a row to draw the drop indicator, if any.
 */
export function useRowDrag(count: number, move: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<Drag | null>(null);

  const over = (event: DragEvent<HTMLElement>, index: number) => {
    if (!drag) return; // something else is being dragged over (a file, a text selection)
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const box = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > box.top + box.height / 2;
    if (drag.over !== index || drag.after !== after) setDrag({ ...drag, over: index, after });
  };

  const drop = (event: DragEvent<HTMLElement>) => {
    if (!drag) return;
    event.preventDefault();
    move(drag.from, dropPosition(drag.from, drag.over, drag.after));
    setDrag(null);
  };

  const keyboard = (event: KeyboardEvent<HTMLElement>, index: number) => {
    const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    const to = index + step;
    if (step === 0 || to < 0 || to >= count) return;
    event.preventDefault();
    move(index, to);
  };

  const bar = (index: number): "before" | "after" | null => {
    if (!drag || drag.over !== index) return null;
    if (dropPosition(drag.from, index, drag.after) === drag.from) return null; // it would not move
    return drag.after ? "after" : "before";
  };

  return {
    dragging: drag?.from ?? null,
    bar,
    over,
    drop,
    keyboard,
    start: (index: number) => setDrag({ from: index, over: index, after: false }),
    end: () => setDrag(null),
  };
}
