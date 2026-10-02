import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown } from "./markdown";

describe("parseInline", () => {
  it("recognizes bold, italic and code between plain text", () => {
    expect(parseInline("Press **Send** then *wait* for `PO-1`.")).toEqual([
      { kind: "text", value: "Press " },
      { kind: "bold", value: "Send" },
      { kind: "text", value: " then " },
      { kind: "italic", value: "wait" },
      { kind: "text", value: " for " },
      { kind: "code", value: "PO-1" },
      { kind: "text", value: "." },
    ]);
  });

  it("leaves unbalanced markers as text", () => {
    expect(parseInline("2 * 3 = 6 and **open")).toEqual([
      { kind: "text", value: "2 * 3 = 6 and **open" },
    ]);
  });
});

describe("parseMarkdown", () => {
  it("splits paragraphs on blank lines and joins wrapped lines", () => {
    const blocks = parseMarkdown("First line\ncontinues here.\n\nSecond paragraph.");

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      kind: "paragraph",
      content: [{ kind: "text", value: "First line continues here." }],
    });
  });

  it("groups consecutive bullets and numbers into lists", () => {
    const blocks = parseMarkdown("Steps:\n1. Choose the file\n2. Check it\n\n- one\n- two");

    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "list", "list"]);
    expect(blocks[1]).toMatchObject({ kind: "list", ordered: true });
    expect(blocks[1]?.kind === "list" && blocks[1].items).toHaveLength(2);
    expect(blocks[2]).toMatchObject({ kind: "list", ordered: false });
  });

  it("never produces markup: HTML in the text stays plain text", () => {
    const [block] = parseMarkdown("<img src=x onerror=alert(1)>");
    expect(block).toEqual({
      kind: "paragraph",
      content: [{ kind: "text", value: "<img src=x onerror=alert(1)>" }],
    });
  });

  it("returns nothing for empty input", () => {
    expect(parseMarkdown("  \n \n")).toEqual([]);
  });
});
