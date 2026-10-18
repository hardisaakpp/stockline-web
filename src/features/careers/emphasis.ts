/**
 * Manual emphasis: the person wraps what matters in `**double asterisks**` and the PDF prints it in bold.
 * It is plain text (nothing hidden), so it survives saving, copying and translation. The same rules are applied by
 * careers-ai when it builds the PDF: a mark must hug its text and stay on one line, and a mark without a pair is dropped.
 */
const MARK = "**";
const PAIR = /\*\*(?=\S)([^\n]+?)(?<=\S)\*\*/g;

export type TextEdit = { value: string; start: number; end: number };

/** The text with its marks removed, split in pieces: `bold` ones are the ones the PDF prints in bold. */
export function emphasisPieces(text: string): { text: string; bold: boolean }[] {
  const pieces: { text: string; bold: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(PAIR)) {
    if (match.index > last) pieces.push({ text: text.slice(last, match.index), bold: false });
    pieces.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last), bold: false });
  return pieces.map((piece) => ({ ...piece, text: piece.text.replaceAll(MARK, "") }));
}

const isSpace = (char: string) => /\s/.test(char);

/** The word around `caret`, or null when the caret is between spaces. */
function wordAround(value: string, caret: number): [number, number] | null {
  let start = caret;
  let end = caret;
  while (start > 0 && !isSpace(value[start - 1])) start--;
  while (end < value.length && !isSpace(value[end])) end++;
  return start < end ? [start, end] : null;
}

/**
 * Puts the selection in bold, or takes it out when it already is. With nothing selected the word under the caret is
 * used. Returns null when there is nothing to do: no word, or a selection over several lines (each line is its own
 * item in the lists, so a mark must never cross a line).
 */
export function toggleEmphasis(value: string, from: number, to: number): TextEdit | null {
  let [start, end] = from === to ? (wordAround(value, from) ?? [from, to]) : [from, to];
  while (start < end && isSpace(value[start])) start++; // marks hug the text: no spaces inside them
  while (end > start && isSpace(value[end - 1])) end--;
  if (start >= end) return null;
  const inner = value.slice(start, end);
  if (inner.includes("\n")) return null;

  const wrapped =
    value.slice(Math.max(0, start - 2), start) === MARK && value.slice(end, end + 2) === MARK;
  if (wrapped) {
    return {
      value: value.slice(0, start - 2) + inner + value.slice(end + 2),
      start: start - 2,
      end: end - 2,
    };
  }
  if (inner.includes(MARK)) {
    const clean = inner.replaceAll(MARK, "");
    return {
      value: value.slice(0, start) + clean + value.slice(end),
      start,
      end: start + clean.length,
    };
  }
  return {
    value: value.slice(0, start) + MARK + inner + MARK + value.slice(end),
    start: start + MARK.length,
    end: end + MARK.length,
  };
}
