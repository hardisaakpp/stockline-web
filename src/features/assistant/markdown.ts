/**
 * A deliberately tiny Markdown reader for Xia's answers: paragraphs, bullet or numbered lists, and
 * **bold**, *italic* and `code`. It produces data, never HTML, so nothing the model writes can inject markup.
 */
export type Inline = { kind: "text" | "bold" | "italic" | "code"; value: string };

export type Block =
  { kind: "paragraph"; content: Inline[] } | { kind: "list"; ordered: boolean; items: Inline[][] };

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/;
const LIST_ITEM = /^\s*([-*•]|\d+[.)])\s+(.*)$/;

export function parseInline(text: string): Inline[] {
  return text
    .split(INLINE)
    .filter((part) => part !== "")
    .map((part): Inline => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return { kind: "bold", value: part.slice(2, -2) };
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return { kind: "code", value: part.slice(1, -1) };
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return { kind: "italic", value: part.slice(1, -1) };
      }
      return { kind: "text", value: part };
    });
}

export function parseMarkdown(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", content: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };

  for (const line of text.split(/\r?\n/)) {
    const item = LIST_ITEM.exec(line);
    if (item) {
      flushParagraph();
      const ordered = /\d/.test(item[1] ?? "");
      const last = blocks.at(-1);
      const content = parseInline(item[2] ?? "");
      if (last?.kind === "list" && last.ordered === ordered) last.items.push(content);
      else blocks.push({ kind: "list", ordered, items: [content] });
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  return blocks;
}
