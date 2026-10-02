import type { ReactNode } from "react";
import { parseMarkdown, type Inline } from "../markdown";

function InlineText({ content }: { content: Inline[] }) {
  return content.map((part, index): ReactNode => {
    switch (part.kind) {
      case "bold":
        return <strong key={index}>{part.value}</strong>;
      case "italic":
        return <em key={index}>{part.value}</em>;
      case "code":
        return (
          <code
            key={index}
            className="rounded bg-background/70 px-1 py-0.5 font-mono text-[0.85em]"
          >
            {part.value}
          </code>
        );
      default:
        return part.value;
    }
  });
}

/** Renders an answer from Xia as React elements (never as HTML). */
export function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {parseMarkdown(text).map((block, index) => {
        if (block.kind === "paragraph") {
          return (
            <p key={index}>
              <InlineText content={block.content} />
            </p>
          );
        }
        const List = block.ordered ? "ol" : "ul";
        return (
          <List
            key={index}
            className={`ml-5 space-y-1 ${block.ordered ? "list-decimal" : "list-disc"}`}
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <InlineText content={item} />
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
