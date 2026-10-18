import { describe, expect, it } from "vitest";
import { emphasisPieces, toggleEmphasis } from "./emphasis";

describe("toggleEmphasis", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(toggleEmphasis("Experto en FastAPI hoy", 11, 18)).toEqual({
      value: "Experto en **FastAPI** hoy",
      start: 13,
      end: 20,
    });
  });

  it("takes the marks off when the selection is already wrapped", () => {
    expect(toggleEmphasis("Experto en **FastAPI** hoy", 13, 20)).toEqual({
      value: "Experto en FastAPI hoy",
      start: 11,
      end: 18,
    });
  });

  it("clears the marks when the selection includes them", () => {
    expect(toggleEmphasis("a **b** c", 2, 7)).toEqual({ value: "a b c", start: 2, end: 3 });
  });

  it("leaves spaces outside the marks", () => {
    expect(toggleEmphasis("uno dos tres", 3, 8)?.value).toBe("uno **dos** tres");
  });

  it("uses the word under the caret when nothing is selected", () => {
    expect(toggleEmphasis("uno dos tres", 5, 5)?.value).toBe("uno **dos** tres");
    expect(toggleEmphasis("uno dos tres", 5, 5)).toEqual({
      value: "uno **dos** tres",
      start: 6,
      end: 9,
    });
  });

  it("does nothing between spaces, on blanks or across lines", () => {
    expect(toggleEmphasis("uno  dos", 4, 4)).toBeNull();
    expect(toggleEmphasis("uno   dos", 3, 6)).toBeNull();
    expect(toggleEmphasis("uno\ndos", 0, 7)).toBeNull();
  });
});

describe("emphasisPieces", () => {
  it("splits the text into plain and bold pieces", () => {
    expect(emphasisPieces("Experto en **FastAPI** y **Celery**.")).toEqual([
      { text: "Experto en ", bold: false },
      { text: "FastAPI", bold: true },
      { text: " y ", bold: false },
      { text: "Celery", bold: true },
      { text: ".", bold: false },
    ]);
  });

  it("does not bold marks with spaces inside or without a pair, and never shows them", () => {
    expect(emphasisPieces("a ** b ** c")).toEqual([{ text: "a  b  c", bold: false }]);
    expect(emphasisPieces("suelto ** aquí")).toEqual([{ text: "suelto  aquí", bold: false }]);
    expect(emphasisPieces("")).toEqual([]);
  });

  it("agrees with the PDF: a mark does not cross lines", () => {
    expect(emphasisPieces("**a\nb**").every((piece) => !piece.bold)).toBe(true);
  });
});
