/**
 * Text that comes from other people (a supplier name typed into a spreadsheet) ends up in front of the model.
 * Shortened and stripped of control characters and line breaks so it cannot smuggle in layout or long instructions.
 */
const isControl = (character: string) => {
  const code = character.charCodeAt(0);
  // C0 and C1 control characters, plus the Unicode line and paragraph separators.
  return code < 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029;
};

export function clean(value: string | null | undefined, max = 60): string {
  const flat = [...(value ?? "")]
    .map((character) => (isControl(character) ? " " : character))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}\u2026` : flat;
}
