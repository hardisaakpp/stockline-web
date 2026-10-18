import { describe, expect, it } from "vitest";
import { dropPosition, moveItem } from "./reorder";

describe("moveItem", () => {
  it("moves an element up and down without touching the original", () => {
    const list = ["a", "b", "c", "d"];
    expect(moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });

  it("returns the same order when the move makes no sense", () => {
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 0, 2)).toEqual(["a", "b"]);
  });
});

describe("dropPosition", () => {
  it("lands before or after the row under the pointer", () => {
    expect(dropPosition(3, 1, false)).toBe(1); // dragging up, upper half of row 1
    expect(dropPosition(3, 1, true)).toBe(2); // dragging up, lower half of row 1
    expect(dropPosition(0, 2, false)).toBe(1); // dragging down, upper half of row 2: just before it
    expect(dropPosition(0, 2, true)).toBe(2); // dragging down, lower half of row 2
  });

  it("is the starting position when dropped where it already is", () => {
    expect(dropPosition(2, 2, false)).toBe(2);
    expect(dropPosition(2, 2, true)).toBe(2);
    expect(dropPosition(2, 1, true)).toBe(2); // lower half of the row above = where it already sits
    expect(dropPosition(2, 3, false)).toBe(2); // upper half of the row below
  });
});
