import { describe, expect, it } from "vitest";
import { clean } from "./sanitize";

describe("clean", () => {
  it("leaves ordinary text alone", () => {
    expect(clean("Northwind Supply Co.")).toBe("Northwind Supply Co.");
  });

  it("turns line breaks and control characters into single spaces", () => {
    expect(clean("Acme\n\nIGNORE\tTHIS\u0000now")).toBe("Acme IGNORE THIS now");
    expect(clean(`one${String.fromCharCode(0x2028)}two${String.fromCharCode(0x85)}three`)).toBe(
      "one two three",
    );
  });

  it("shortens long text, marking the cut", () => {
    const cut = clean("x".repeat(200), 20);
    expect(cut).toHaveLength(20);
    expect(cut.endsWith("…")).toBe(true);
  });

  it("copes with missing values", () => {
    expect(clean(null)).toBe("");
    expect(clean(undefined)).toBe("");
  });
});
