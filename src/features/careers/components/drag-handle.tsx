import { GripVertical } from "lucide-react";
import type { DragEvent, KeyboardEvent } from "react";

/**
 * Grip that starts a drag of the card it sits in; ↑ ↓ move the card when the grip has the focus. It is a
 * `div` and not a `button` because Firefox does not start a drag from a button.
 */
export function DragHandle({
  label,
  hint,
  onKeyDown,
  onStart,
  onEnd,
}: {
  /** Accessible name, e.g. «Move Backend (position 2 of 3)». */
  label: string;
  hint: string;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onStart: () => void;
  onEnd: () => void;
}) {
  const start = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", label); // Firefox does not start a drag without data
    const card = event.currentTarget.closest("[data-reorder-card]");
    if (card) event.dataTransfer.setDragImage?.(card, 16, 16);
    onStart();
  };
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      aria-label={label}
      aria-keyshortcuts="ArrowUp ArrowDown"
      title={hint}
      onKeyDown={onKeyDown}
      onDragStart={start}
      onDragEnd={onEnd}
      className="-ml-1 flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </div>
  );
}
