import { emphasisPieces } from "../emphasis";

/** A text with its `**marks**` shown as the PDF prints them: the marked words in bold, the marks themselves gone. */
export function EmphasisText({ text }: { text: string }) {
  return (
    <>
      {emphasisPieces(text).map((piece, i) =>
        piece.bold ? <strong key={i}>{piece.text}</strong> : piece.text,
      )}
    </>
  );
}
